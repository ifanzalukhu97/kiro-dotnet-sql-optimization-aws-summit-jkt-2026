using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class HealthControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private readonly TestWebApplicationFactory _factory;

        public HealthControllerTests(TestWebApplicationFactory factory)
        {
            _factory = factory;
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetHealth_WhenDatabaseAvailable_Returns200Healthy()
        {
            var response = await _client.GetAsync("/health");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("status", out var statusElement));
            Assert.Equal("healthy", statusElement.GetString());
        }

        [Fact]
        public async Task GetHealth_WhenDatabaseUnavailable_Returns503Unhealthy()
        {
            // Create a separate factory with an invalid connection string
            var unhealthyFactory = new WebApplicationFactory<WideWorldImporters.Api.Startup>()
                .WithWebHostBuilder(builder =>
                {
                    builder.UseEnvironment("Development");
                    builder.ConfigureAppConfiguration((context, config) =>
                    {
                        config.Sources.Clear();
                        config.AddInMemoryCollection(new[]
                        {
                            new System.Collections.Generic.KeyValuePair<string, string>(
                                "ConnectionStrings:DefaultConnection",
                                "Server=invalid_host_that_does_not_exist;Database=WideWorldImporters;User Id=sa;Password=test;Connection Timeout=1;")
                        });
                    });

                    // Clear environment variables that could override the bad connection string
                    System.Environment.SetEnvironmentVariable("CONNECTION_STRING", null);
                    System.Environment.SetEnvironmentVariable("ConnectionStrings__DefaultConnection", null);
                });

            var client = unhealthyFactory.CreateClient();
            var response = await client.GetAsync("/health");

            Assert.Equal(HttpStatusCode.ServiceUnavailable, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("status", out var statusElement));
            Assert.Equal("unhealthy", statusElement.GetString());
            Assert.True(root.TryGetProperty("error", out _));

            unhealthyFactory.Dispose();
        }
    }
}
