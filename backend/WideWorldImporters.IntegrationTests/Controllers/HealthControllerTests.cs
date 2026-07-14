using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Data;
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
                    builder.ConfigureServices(services =>
                    {
                        // Remove the existing DbContext registration
                        var descriptor = new ServiceDescriptor(
                            typeof(DbContextOptions<WideWorldImportersContext>),
                            typeof(DbContextOptions<WideWorldImportersContext>),
                            ServiceLifetime.Singleton);

                        // Re-register DbContext with an invalid connection string
                        services.AddDbContext<WideWorldImportersContext>(options =>
                            options.UseSqlServer("Server=invalid_host_that_does_not_exist;Database=WideWorldImporters;User Id=sa;Password=test;Connection Timeout=1;"));
                    });
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
