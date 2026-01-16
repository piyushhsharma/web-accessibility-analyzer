package services

import "time"

func GenerateMockReport(url string) map[string]interface{} {
	return map[string]interface{}{
		"url":   url,
		"score": 78,
		"issues": []map[string]string{
			{
				"impact":      "critical",
				"description": "Image elements do not have alt attributes",
				"wcag":        "1.1.1",
			},
			{
				"impact":      "moderate",
				"description": "Form inputs lack associated labels",
				"wcag":        "3.3.2",
			},
		},
		"generatedAt": time.Now(),
	}
}
