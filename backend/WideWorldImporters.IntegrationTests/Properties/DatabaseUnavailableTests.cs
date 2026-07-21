using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Properties
{
    /// <summary>
    /// Validates: Requirements 2.3, 2.4, 13.9
    /// </summary>
    public class DatabaseUnavailableWebApplicationFactory : WebApplicationFactory<WideWorldImporters.Api.Startup>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.Sources.Clear();
                config.AddInMemoryCollection(new[]
                {
                    new System.Collections.Generic.KeyValuePair<string, string>(
                        "ConnectionStrings:DefaultConnection",
                        "Server=localhost,19999;Database=NonExistentDb;User Id=sa;Password=Bad!Password;Connect Timeout=1;")
                });
            });

            // Clear environment variables that could override the bad connection string
            System.Environment.SetEnvironmentVariable("CONNECTION_STRING", null);
            System.Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", null);

            builder.UseEnvironment("Development");
        }
    }

    // Feature: demo-booth-aws-summit-jkt-2026, Property 6: Database unavailability produces 503 for all endpoints
    public class DatabaseUnavailableTests : IClassFixture<DatabaseUnavailableWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        private static readonly string[] AllEndpoints = new[]
        {
            "/api/orders",
            "/api/customers",
            "/api/stockitems",
            "/api/invoices",
            "/api/productsearch",
            "/api/suppliers",
            "/api/purchaseorders",
            "/api/delivery",
            "/api/warehouse",
            "/api/payment",
            "/api/dashboard",
            "/health"
        };

        public DatabaseUnavailableTests(DatabaseUnavailableWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Property(MaxTest = 100)]
        public Property DatabaseUnavailable_Returns503WithErrorFields()
        {
            var endpointIndexGen = Gen.Choose(0, AllEndpoints.Length - 1);

            return Prop.ForAll(endpointIndexGen.ToArbitrary(), endpointIndex =>
            {
                var endpoint = AllEndpoints[endpointIndex];
                return VerifyServiceUnavailable(endpoint).GetAwaiter().GetResult();
            });
        }

        private async Task<bool> VerifyServiceUnavailable(string endpoint)
        {
            var response = await _client.GetAsync(endpoint);

            if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
                return false;

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            // Verify JSON contains errorCode field
            if (!root.TryGetProperty("errorCode", out _) &&
                !root.TryGetProperty("status", out _))
            {
                // Health endpoint returns { status: "unhealthy", error: "..." }
                // Other endpoints return { errorCode: "...", message: "..." }
                return false;
            }

            // For non-health endpoints: must have errorCode and message
            if (endpoint != "/health")
            {
                if (!root.TryGetProperty("errorCode", out var errorCodeElement))
                    return false;
                if (errorCodeElement.GetString() == null || errorCodeElement.GetString().Length == 0)
                    return false;

                if (!root.TryGetProperty("message", out var messageElement))
                    return false;
                if (messageElement.GetString() == null || messageElement.GetString().Length == 0)
                    return false;
            }
            else
            {
                // Health endpoint: must have status field
                if (!root.TryGetProperty("status", out var statusElement))
                    return false;
                if (statusElement.GetString() != "unhealthy")
                    return false;
            }

            return true;
        }
    }
}
