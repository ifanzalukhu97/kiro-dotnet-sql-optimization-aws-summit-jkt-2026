using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class ProductSearchControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public ProductSearchControllerTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetProducts_ReturnsOkWithPaginatedJson()
        {
            var response = await _client.GetAsync("/api/productsearch?page=1&pageSize=20");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("data", out var dataElement));
            Assert.Equal(JsonValueKind.Array, dataElement.ValueKind);
            Assert.True(dataElement.GetArrayLength() <= 20);

            Assert.True(root.TryGetProperty("page", out _));
            Assert.True(root.TryGetProperty("pageSize", out _));
            Assert.True(root.TryGetProperty("totalCount", out _));
        }
    }
}
