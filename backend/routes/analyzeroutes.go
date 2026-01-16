package routes

import (
	"github.com/gin-gonic/gin"
	"web-accessibility-analyzer-backend/controllers"
)

func RegisterAnalyzeRoutes(r *gin.Engine) {
	r.POST("/analyze", controllers.AnalyzeWebsite)
}
