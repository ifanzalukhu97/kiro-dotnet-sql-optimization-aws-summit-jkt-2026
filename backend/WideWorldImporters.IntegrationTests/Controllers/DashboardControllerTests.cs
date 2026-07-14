using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class DashboardControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public DashboardControllerTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetDashboardKpis_ReturnsOkWithKpiFields()
        {
            var response = await _client.GetAsync("/api/dashboard");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("totalOrders", out _));
            Assert.True(root.TryGetProperty("totalCustomers", out _));
            Assert.True(root.TryGetProperty("totalRevenue", out _));
            Assert.True(root.TryGetProperty("totalStockItems", out _));
        }
    }
}
