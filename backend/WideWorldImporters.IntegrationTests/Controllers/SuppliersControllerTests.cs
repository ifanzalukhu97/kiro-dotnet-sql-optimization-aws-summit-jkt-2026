using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class SuppliersControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public SuppliersControllerTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetSuppliers_ReturnsOkWithPaginatedJson()
        {
            var response = await _client.GetAsync("/api/suppliers?page=1&pageSize=20");

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
        public async Task GetSupplier_WithValidId_ReturnsOkWithCorrectFields()
        {
            var response = await _client.GetAsync("/api/suppliers/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("supplierId", out _));
            Assert.True(root.TryGetProperty("supplierName", out _));
            Assert.True(root.TryGetProperty("recentPurchaseOrders", out _));
        }

        [Fact]
        public async Task GetSupplier_ReturnsRecentPurchaseOrdersArray()
        {
            var response = await _client.GetAsync("/api/suppliers/1");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);

            Assert.True(doc.RootElement.TryGetProperty("recentPurchaseOrders", out var purchaseOrders));
            Assert.Equal(JsonValueKind.Array, purchaseOrders.ValueKind);
        }

        [Fact]
        public async Task GetSupplier_WithNonExistentId_Returns404WithError()
        {
            var response = await _client.GetAsync("/api/suppliers/999999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetSupplier_WithMalformedId_Returns400WithError()
        {
            var response = await _client.GetAsync("/api/suppliers/abc");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetSupplier_StockItems_StillReturnsData()
        {
            var response = await _client.GetAsync("/api/suppliers/1");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);

            Assert.True(doc.RootElement.TryGetProperty("stockItems", out var stockItems));
            Assert.Equal(JsonValueKind.Array, stockItems.ValueKind);
        }

        [Fact]
        public async Task GetSupplierCategoriesLookup_ReturnsJsonArrayWithIdAndName()
        {
            var response = await _client.GetAsync("/api/suppliers/lookup");

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
