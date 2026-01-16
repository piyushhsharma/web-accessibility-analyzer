package controllers

import (
	"net/http"

	"github.com/gin-gonic/gin"
	"web-accessibility-analyzer-backend/services"
)

type AnalyzeRequest struct {
	URL string `json:"url"`
}

func AnalyzeWebsite(c *gin.Context) {
	var req AnalyzeRequest

	if err := c.ShouldBindJSON(&req); err != nil || req.URL == "" {
		c.JSON(http.StatusBadRequest, gin.H{
			"error": "Invalid URL",
		})
		return
	}

	report := services.GenerateMockReport(req.URL)

	c.JSON(http.StatusOK, report)
}
