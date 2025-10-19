resource "aws_iam_role" "lambda_role" {
  name = "crypto-news-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy" "lambda_policy" {
  name = "crypto-news-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "dynamodb:GetItem",
          "dynamodb:PutItem",
          "dynamodb:Query",
        ]
        Resource = aws_dynamodb_table.crypto_news_cache.arn
      },
      {
        Effect = "Allow"
        Action = [
          "bedrock:InvokeModel"
        ]
        Resource = "arn:aws:bedrock:${var.aws_region}::foundation-model/anthropic.claude-3-haiku-20240307-v1:0"
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:${var.aws_region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*"
      }
    ]
  })
}

resource "aws_lambda_function" "crypto_news" {
  count               = fileexists("${path.module}/lambda_package/lambda_crypto_news.zip") ? 1 : 0
  filename            = "${path.module}/lambda_package/lambda_crypto_news.zip"
  function_name       = var.lambda_function_name
  role                = aws_iam_role.lambda_role.arn
  handler             = "handler.handler"
  runtime             = "nodejs18.x"
  timeout             = 30
  memory_size         = 512

  environment {
    variables = {
      NEWSDATA_API_KEY  = var.newsdata_api_key
      DDB_TABLE         = aws_dynamodb_table.crypto_news_cache.name
      BEDROCK_MODEL_ID  = var.bedrock_model_id
      CACHE_TTL         = var.cache_ttl
      MAX_RETRIES       = var.max_retries
    }
  }

  source_code_hash = try(filebase64sha256("${path.module}/lambda_package/lambda_crypto_news.zip"), "placeholder")
}

resource "aws_api_gateway_rest_api" "crypto_news_api" {
  name        = var.api_gateway_name
  description = "Crypto News Enrichment API"
}

resource "aws_api_gateway_resource" "news_resource" {
  rest_api_id = aws_api_gateway_rest_api.crypto_news_api.id
  parent_id   = aws_api_gateway_rest_api.crypto_news_api.root_resource_id
  path_part   = "news"
}

resource "aws_api_gateway_method" "news_get" {
  rest_api_id      = aws_api_gateway_rest_api.crypto_news_api.id
  resource_id      = aws_api_gateway_resource.news_resource.id
  http_method      = "GET"
  authorization    = "NONE"

  request_parameters = {
    "method.request.querystring.sentiment" = false
  }
}

# Add OPTIONS method for CORS preflight requests
resource "aws_api_gateway_method" "news_options" {
  rest_api_id      = aws_api_gateway_rest_api.crypto_news_api.id
  resource_id      = aws_api_gateway_resource.news_resource.id
  http_method      = "OPTIONS"
  authorization    = "NONE"
}

# Mock integration for OPTIONS - returns 200 with CORS headers
resource "aws_api_gateway_integration" "options_integration" {
  rest_api_id      = aws_api_gateway_rest_api.crypto_news_api.id
  resource_id      = aws_api_gateway_resource.news_resource.id
  http_method      = aws_api_gateway_method.news_options.http_method
  type             = "MOCK"
  request_templates = {
    "application/json" = "{\"statusCode\": 200}"
  }
}

# OPTIONS method response with CORS headers
resource "aws_api_gateway_method_response" "options_response" {
  rest_api_id      = aws_api_gateway_rest_api.crypto_news_api.id
  resource_id      = aws_api_gateway_resource.news_resource.id
  http_method      = aws_api_gateway_method.news_options.http_method
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = true
    "method.response.header.Access-Control-Allow-Methods" = true
    "method.response.header.Access-Control-Allow-Origin"  = true
  }

  depends_on = [aws_api_gateway_method.news_options]
}

# Integration response for OPTIONS
resource "aws_api_gateway_integration_response" "options_integration_response" {
  rest_api_id      = aws_api_gateway_rest_api.crypto_news_api.id
  resource_id      = aws_api_gateway_resource.news_resource.id
  http_method      = aws_api_gateway_method.news_options.http_method
  status_code      = "200"

  response_parameters = {
    "method.response.header.Access-Control-Allow-Headers" = "'Content-Type,Authorization'"
    "method.response.header.Access-Control-Allow-Methods" = "'GET,OPTIONS'"
    "method.response.header.Access-Control-Allow-Origin"  = "'*'"
  }

  depends_on = [aws_api_gateway_integration.options_integration]
}

resource "aws_api_gateway_integration" "lambda_integration" {
  count               = fileexists("${path.module}/lambda_package/lambda_crypto_news.zip") ? 1 : 0
  rest_api_id      = aws_api_gateway_rest_api.crypto_news_api.id
  resource_id      = aws_api_gateway_resource.news_resource.id
  http_method      = aws_api_gateway_method.news_get.http_method
  type             = "AWS_PROXY"
  integration_http_method = "POST"
  uri              = aws_lambda_function.crypto_news[0].invoke_arn
}

resource "aws_lambda_permission" "api_gateway" {
  count             = fileexists("${path.module}/lambda_package/lambda_crypto_news.zip") ? 1 : 0
  statement_id  = "AllowAPIGatewayInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.crypto_news[0].function_name
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_api_gateway_rest_api.crypto_news_api.execution_arn}/*/*"
}

resource "aws_api_gateway_deployment" "api_deployment" {
  rest_api_id = aws_api_gateway_rest_api.crypto_news_api.id

  lifecycle {
    create_before_destroy = true
  }

  triggers = {
    lambda_updated = fileexists("${path.module}/lambda_package/lambda_crypto_news.zip") ? aws_lambda_function.crypto_news[0].source_code_hash : ""
    api_updated    = aws_api_gateway_integration.options_integration.id
  }

  depends_on = [
    aws_api_gateway_integration.lambda_integration,
    aws_api_gateway_integration.options_integration,
    aws_api_gateway_method_response.response_200,
    aws_api_gateway_integration_response.response_integration,
    aws_api_gateway_method_response.options_response,
    aws_api_gateway_integration_response.options_integration_response
  ]
}

resource "aws_api_gateway_stage" "api_stage" {
  deployment_id = aws_api_gateway_deployment.api_deployment.id
  rest_api_id   = aws_api_gateway_rest_api.crypto_news_api.id
  stage_name    = var.api_stage_name
}

resource "aws_cloudwatch_log_group" "api_gateway_logs" {
  name              = "/aws/apigateway/crypto-news-api"
  retention_in_days = 7
}

resource "aws_api_gateway_method_response" "response_200" {
  rest_api_id      = aws_api_gateway_rest_api.crypto_news_api.id
  resource_id      = aws_api_gateway_resource.news_resource.id
  http_method      = aws_api_gateway_method.news_get.http_method
  status_code      = "200"
  response_models = {
    "application/json" = "Empty"
  }

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = true
  }
}

resource "aws_api_gateway_integration_response" "response_integration" {
  rest_api_id      = aws_api_gateway_rest_api.crypto_news_api.id
  resource_id      = aws_api_gateway_resource.news_resource.id
  http_method      = aws_api_gateway_method.news_get.http_method
  status_code      = aws_api_gateway_method_response.response_200.status_code

  response_parameters = {
    "method.response.header.Access-Control-Allow-Origin" = "'*'"
  }

  depends_on = [aws_api_gateway_integration.lambda_integration]
}
