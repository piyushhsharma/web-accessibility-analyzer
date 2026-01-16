package models

type Report struct {
    URL    string   `json:"url" bson:"url"`
    Score  int      `json:"score" bson:"score"`
    Issues []string `json:"issues" bson:"issues"`
}
