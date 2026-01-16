package main

import (
    "context"
    "log"
    "net/http"
    "time"

    "accessibility-backend/models"
    "github.com/gin-contrib/cors"
    "github.com/gin-gonic/gin"
    "go.mongodb.org/mongo-driver/mongo"
    "go.mongodb.org/mongo-driver/mongo/options"
)

var reportCollection *mongo.Collection

func main() {
    // MongoDB connection
    client, err := mongo.NewClient(options.Client().ApplyURI("mongodb://localhost:27017"))
    if err != nil {
        log.Fatal(err)
    }

    ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
    defer cancel()
    err = client.Connect(ctx)
    if err != nil {
        log.Fatal(err)
    }

    reportCollection = client.Database("accessibilityDB").Collection("reports")
    log.Println("Connected to MongoDB!")

    // Gin router
    router := gin.Default()

    // CORS for frontend
    router.Use(cors.Default())

    // API route
    router.POST("/api/analyze", analyzeHandler)

    log.Println("Server running on :8080")
    router.Run(":8080")
}

// Handler for analysis
func analyzeHandler(c *gin.Context) {
    var input struct {
        URL string `json:"url"`
    }

    if err := c.ShouldBindJSON(&input); err != nil {
        c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
        return
    }

    // Dummy analysis logic (replace with real analysis later)
    issues := []string{}
    score := 100

    if input.URL == "" {
        issues = append(issues, "URL is empty")
        score -= 50
    } else {
        issues = append(issues, "Missing alt attributes")
        issues = append(issues, "Low contrast text")
        score -= 15
    }

    report := models.Report{
        URL:    input.URL,
        Score:  score,
        Issues: issues,
    }

    // Store in MongoDB
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()
    _, err := reportCollection.InsertOne(ctx, report)
    if err != nil {
        log.Println("Error storing report:", err)
    }

    // Return JSON
    c.JSON(http.StatusOK, report)
}
