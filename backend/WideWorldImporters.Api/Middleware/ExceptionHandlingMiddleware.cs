using System;
using System.Net;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.Data.SqlClient;
using WideWorldImporters.Api.Exceptions;

namespace WideWorldImporters.Api.Middleware
{
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;

        public ExceptionHandlingMiddleware(RequestDelegate next)
        {
            _next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (EntityNotFoundException ex)
            {
                await WriteJsonResponse(context, (int)HttpStatusCode.NotFound, new
                {
                    error = ex.Message
                });
            }
            catch (ValidationException ex)
            {
                await WriteJsonResponse(context, (int)HttpStatusCode.BadRequest, new
                {
                    error = ex.Message
                });
            }
            catch (SqlException ex) when (IsConnectionError(ex))
            {
                await WriteJsonResponse(context, (int)HttpStatusCode.ServiceUnavailable, new
                {
                    errorCode = "DATABASE_UNAVAILABLE",
                    message = "Unable to connect to the database. Please try again later."
                });
            }
            catch (Exception ex) when (GetSqlConnectionException(ex) != null)
            {
                await WriteJsonResponse(context, (int)HttpStatusCode.ServiceUnavailable, new
                {
                    errorCode = "DATABASE_UNAVAILABLE",
                    message = "Unable to connect to the database. Please try again later."
                });
            }
            catch (Exception)
            {
                await WriteJsonResponse(context, (int)HttpStatusCode.InternalServerError, new
                {
                    errorCode = "INTERNAL_ERROR",
                    message = "An unexpected error occurred"
                });
            }
        }

        private static bool IsConnectionError(SqlException ex)
        {
            // SQL Server connection-related error numbers:
            // 0: TCP Provider could not open connection
            // -2: Timeout expired
            // 2: Connection error
            // 53: Named pipe/network path not found
            // 233: Connection closed
            // 10054: Connection forcibly closed
            // 10061: Connection refused
            // 11001: Host not found
            // 40613: Database unavailable (Azure)
            switch (ex.Number)
            {
                case 0:
                case -2:
                case 2:
                case 53:
                case 233:
                case 10054:
                case 10061:
                case 11001:
                case 40613:
                    return true;
                default:
                    // Class >= 20 indicates severe/connection-level errors
                    return ex.Class >= 20;
            }
        }

        private static SqlException GetSqlConnectionException(Exception ex)
        {
            // Walk the InnerException chain to find a SqlException that is a connection error
            var inner = ex.InnerException;
            while (inner != null)
            {
                if (inner is SqlException sqlEx && IsConnectionError(sqlEx))
                    return sqlEx;
                inner = inner.InnerException;
            }
            return null;
        }

        private static async Task WriteJsonResponse(HttpContext context, int statusCode, object body)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(body, options));
        }
    }
}
