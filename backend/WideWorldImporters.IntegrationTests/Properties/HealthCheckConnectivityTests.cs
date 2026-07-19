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
    /// Validates: Requirements 2.4
    /// </summary>
    // Feature: demo-booth-aws-summit-jkt-2026, Property 7: Health check reflects live database connectivity
    public class HealthCheckConnectivityTests : IClassFixture<TestWebApplicationFactory>, IClassFixture<UnhealthyWebApplicationFactory>
    {
        private readonly HttpClient _healthyClient;
        private readonly HttpClient _unhealthyClient;

        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        public HealthCheckConnectivityTests(TestWebApplicationFactory healthyFactory, UnhealthyWebApplicationFactory unhealthyFactory)
        {
            _healthyClient = healthyFactory.CreateClient();
            _unhealthyClient = unhealthyFactory.CreateClient();
        }

        [Property(MaxTest = 100)]
        public Property HealthCheck_ReflectsConnectivityState()
        {
            var connectivityGen = Arb.Generate<bool>();

            return Prop.ForAll(connectivityGen.ToArbitrary(), isHealthy =>
            {
                return VerifyHealthCheckResponse(isHealthy).GetAwaiter().GetResult();
            });
        }

        private async Task<bool> VerifyHealthCheckResponse(bool useHealthyConnection)
        {
            var client = useHealthyConnection ? _healthyClient : _unhealthyClient;
            var response = await client.GetAsync("/health");
            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            if (useHealthyConnection)
            {
                // Healthy: expect 200 + status "healthy"
                if (response.StatusCode != HttpStatusCode.OK)
                    return false;
                if (!root.TryGetProperty("status", out var statusEl))
                    return false;
                if (statusEl.GetString() != "healthy")
                    return false;
            }
            else
            {
                // Unhealthy: expect 503 + status "unhealthy" + error field present
                if (response.StatusCode != HttpStatusCode.ServiceUnavailable)
                    return false;
                if (!root.TryGetProperty("status", out var statusEl))
                    return false;
                if (statusEl.GetString() != "unhealthy")
                    return false;
                if (!root.TryGetProperty("error", out var errorEl))
                    return false;
                if (string.IsNullOrEmpty(errorEl.GetString()))
                    return false;
            }

            return true;
        }

        [Fact]
        public async Task HealthCheck_WhenDatabaseReachable_Returns200WithHealthyStatus()
        {
            var response = await _healthyClient.GetAsync("/health");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("status", out var statusEl));
            Assert.Equal("healthy", statusEl.GetString());
        }

        [Fact]
        public async Task HealthCheck_WhenDatabaseUnreachable_Returns503WithUnhealthyStatus()
        {
            var response = await _unhealthyClient.GetAsync("/health");
            Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("status", out var statusEl));
            Assert.Equal("unhealthy", statusEl.GetString());
            Assert.True(root.TryGetProperty("error", out var errorEl));
            Assert.False(string.IsNullOrEmpty(errorEl.GetString()));
        }
    }

    /// <summary>
    /// WebApplicationFactory configured with an invalid connection string
    /// to simulate database unavailability.
    /// </summary>
    public class UnhealthyWebApplicationFactory : WebApplicationFactory<WideWorldImporters.Api.Startup>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureAppConfiguration((context, config) =>
            {
                config.AddInMemoryCollection(new[]
                {
                    new System.Collections.Generic.KeyValuePair<string, string>(
                        "ConnectionStrings:DefaultConnection",
                        "Server=invalid_host_that_does_not_exist;Database=NoDb;User Id=sa;Password=x;Connect Timeout=1;")
                });
            });

            builder.UseEnvironment("Development");
        }
    }
}
