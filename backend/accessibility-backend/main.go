package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"web-accessibility-analyzer-backend/models"

	"github.com/chromedp/chromedp"
	"github.com/chromedp/cdproto/runtime"
	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"go.mongodb.org/mongo-driver/mongo"
	"go.mongodb.org/mongo-driver/mongo/options"
)

var reportCollection *mongo.Collection

func main() {
	// ---------- MongoDB ----------
	client, err := mongo.NewClient(options.Client().ApplyURI("mongodb://localhost:27017"))
	if err != nil {
		log.Fatal(err)
	}
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := client.Connect(ctx); err != nil {
		log.Fatal(err)
	}

	reportCollection = client.Database("accessibilityDB").Collection("reports")
	log.Println("✅ Connected to MongoDB")

	// ---------- Gin ----------
	router := gin.Default()
	router.Use(cors.Default())

	// Serve static axe.min.js
	router.Static("/static", "./static")

	router.POST("/api/analyze", analyzeHandler)

	port := strings.TrimSpace(os.Getenv("PORT"))
	if port == "" {
		port = "8080"
	}
	addr := ":" + port

	log.Printf("🚀 Server running on http://localhost%s", addr)
	if err := router.Run(addr); err != nil {
		log.Fatal(err)
	}
}

// ---------- API Handler ----------
func analyzeHandler(c *gin.Context) {
	var input struct {
		URL string `json:"url"`
	}

	if err := c.ShouldBindJSON(&input); err != nil || input.URL == "" {
		c.JSON(400, gin.H{"error": "Request body must be: { \"url\": \"https://example.com\" }"})
		return
	}

	report, err := runAxeAnalysis(input.URL)
	if err != nil {
		log.Println("❌ Analysis error:", err)
		c.JSON(500, gin.H{"error": fmt.Sprintf("Accessibility analysis failed: %v", err)})
		return
	}

	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	_, _ = reportCollection.InsertOne(ctx, report)

	c.JSON(200, report)
}

// ---------- Axe Analysis ----------
func runAxeAnalysis(url string) (*models.Report, error) {
	// Chrome setup
	opts := append(chromedp.DefaultExecAllocatorOptions[:],
		chromedp.Flag("headless", true),
		chromedp.Flag("disable-gpu", true),
		chromedp.Flag("no-sandbox", true),
		chromedp.Flag("disable-setuid-sandbox", true),
	)
	allocCtx, cancel := chromedp.NewExecAllocator(context.Background(), opts...)
	defer cancel()

	ctx, cancel := chromedp.NewContext(allocCtx)
	defer cancel()

	ctx, cancel = context.WithTimeout(ctx, 90*time.Second)
	defer cancel()

	// Load axe.min.js
	axeJS, err := os.ReadFile("static/axe.min.js")
	if err != nil {
		return nil, fmt.Errorf("axe.min.js missing: %v", err)
	}

	// JS to run axe and return JSON array
	var result string
	// NOTE: this returns a Promise; we must evaluate it with "awaitPromise: true"
	// (chromedp.EvaluateAsDevTools) so Go receives the resolved string, not a JS object.
	js := string(axeJS) + `
	(() => {
		return axe.run()
			.then(res => JSON.stringify(
				res.violations.map(v => ({
					id: v.id,
					impact: v.impact,
					help: v.help,
					description: v.description,
					helpUrl: v.helpUrl,
					nodesAffected: (v.nodes || []).length
				}))
			))
			.catch(() => JSON.stringify([]));
	})()
	`

	err = chromedp.Run(ctx,
		chromedp.Navigate(url),
		chromedp.WaitVisible("body", chromedp.ByQuery),
		chromedp.Sleep(2*time.Second),
		chromedp.EvaluateAsDevTools(js, &result, func(p *runtime.EvaluateParams) *runtime.EvaluateParams {
			return p.WithAwaitPromise(true)
		}),
	)
	if err != nil {
		return nil, fmt.Errorf("axe evaluation failed: %v", err)
	}

	// Parse JSON array into Go slice
	var violations []models.Violation

	if err := json.Unmarshal([]byte(result), &violations); err != nil {
		return nil, fmt.Errorf("failed to parse axe output: %v", err)
	}

	issues := []string{}
	impactCounts := map[string]int{}
	for _, v := range violations {
		impact := v.Impact
		if impact == "" {
			impact = "unknown"
		}
		impactCounts[impact]++
		issues = append(issues, fmt.Sprintf("%s (%s)", v.Help, impact))
	}

	// Simple scoring logic
	score := 100 - len(issues)*8
	if score < 0 {
		score = 0
	}

	return &models.Report{
		URL:          url,
		Score:        score,
		Issues:       issues,
		Violations:   violations,
		ImpactCounts: impactCounts,
	}, nil
}
