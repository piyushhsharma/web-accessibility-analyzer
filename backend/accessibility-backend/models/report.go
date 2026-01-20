package models

type Violation struct {
	ID            string `json:"id" bson:"id"`
	Impact        string `json:"impact" bson:"impact"`
	Help          string `json:"help" bson:"help"`
	Description   string `json:"description" bson:"description"`
	HelpURL       string `json:"helpUrl" bson:"helpUrl"`
	NodesAffected int    `json:"nodesAffected" bson:"nodesAffected"`
}

type Report struct {
	URL          string            `json:"url" bson:"url"`
	Score        int               `json:"score" bson:"score"`
	Issues       []string          `json:"issues" bson:"issues"`
	Violations   []Violation       `json:"violations" bson:"violations"`
	ImpactCounts map[string]int    `json:"impactCounts" bson:"impactCounts"`
}
