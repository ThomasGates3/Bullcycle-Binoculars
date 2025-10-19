variable "aws_region" {
  description = "AWS region for deployment"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "prod"
}

variable "bucket_name" {
  description = "S3 bucket name for hosting"
  type        = string
  default     = "bullcycle-binoculars"
}

variable "enable_cloudfront" {
  description = "Enable CloudFront distribution"
  type        = bool
  default     = true
}

variable "ddb_table_name" {
  description = "DynamoDB table name for crypto news cache"
  type        = string
  default     = "crypto-news-cache"
}

variable "lambda_function_name" {
  description = "Lambda function name for crypto news enrichment"
  type        = string
  default     = "crypto-news-enricher"
}

variable "api_gateway_name" {
  description = "API Gateway name for crypto news API"
  type        = string
  default     = "crypto-news-api"
}

variable "api_stage_name" {
  description = "API Gateway stage name"
  type        = string
  default     = "prod"
}

variable "newsdata_api_key" {
  description = "NewsData.io API key"
  type        = string
  sensitive   = true
}

variable "bedrock_model_id" {
  description = "Bedrock model ID for sentiment analysis"
  type        = string
  default     = "anthropic.claude-3-haiku-20240307-v1:0"
}

variable "cache_ttl" {
  description = "Cache TTL in seconds"
  type        = number
  default     = 900
}

variable "max_retries" {
  description = "Maximum retries for external API calls"
  type        = number
  default     = 5
}
