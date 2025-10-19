output "s3_bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.website.id
}

output "s3_bucket_region" {
  description = "AWS region for S3 bucket"
  value       = aws_s3_bucket.website.region
}

output "s3_website_endpoint" {
  description = "S3 website endpoint URL"
  value       = "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}

output "cloudfront_domain_name" {
  description = "CloudFront distribution domain name"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.s3_distribution[0].domain_name : null
}

output "cloudfront_distribution_id" {
  description = "CloudFront distribution ID (for cache invalidation)"
  value       = var.enable_cloudfront ? aws_cloudfront_distribution.s3_distribution[0].id : null
}

output "live_url" {
  description = "Live URL for accessing the website"
  value       = var.enable_cloudfront ? "https://${aws_cloudfront_distribution.s3_distribution[0].domain_name}" : "http://${aws_s3_bucket_website_configuration.website.website_endpoint}"
}

output "deployment_info" {
  description = "Deployment information"
  value = {
    s3_bucket = aws_s3_bucket.website.id
    cloudfront_enabled = var.enable_cloudfront
    cloudfront_id = var.enable_cloudfront ? aws_cloudfront_distribution.s3_distribution[0].id : "N/A"
    region = aws_s3_bucket.website.region
  }
}
