resource "aws_dynamodb_table" "crypto_news_cache" {
  name           = var.ddb_table_name
  billing_mode   = "PAY_PER_REQUEST"
  hash_key       = "queryKey"

  attribute {
    name = "queryKey"
    type = "S"
  }

  ttl {
    attribute_name = "ttl"
    enabled        = true
  }

  tags = {
    Name        = "crypto-news-cache"
    Environment = var.environment
  }
}
