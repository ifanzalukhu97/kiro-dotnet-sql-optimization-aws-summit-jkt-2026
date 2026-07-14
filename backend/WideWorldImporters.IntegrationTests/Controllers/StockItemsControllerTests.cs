using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class StockItemsControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public StockItemsControllerTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetStockItems_ReturnsOkWithPaginatedJson()
        {
            var response = await _client.GetAsync("/api/stockitems?page=1&pageSize=20");

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

        [Fact]
        public async Task GetStockItem_WithValidId_ReturnsOkWithCorrectFields()
        {
            var response = await _client.GetAsync("/api/stockitems/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("stockItemId", out _));
            Assert.True(root.TryGetProperty("stockItemName", out _));
            Assert.True(root.TryGetProperty("stockGroups", out _));
        }

        [Fact]
        public async Task GetStockItem_WithNonExistentId_Returns404WithError()
        {
            var response = await _client.GetAsync("/api/stockitems/999999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetStockItem_WithMalformedId_Returns400WithError()
        {
            var response = await _client.GetAsync("/api/stockitems/abc");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetStockItemsLookup_ReturnsJsonArrayWithIdAndName()
        {
            var response = await _client.GetAsync("/api/stockitems/lookup");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            if (root.GetArrayLength() > 0)
            {
                var firstItem = root[0];
                Assert.True(firstItem.TryGetProperty("id", out _));
                Assert.True(firstItem.TryGetProperty("name", out _));
            }
        }
    }
}
