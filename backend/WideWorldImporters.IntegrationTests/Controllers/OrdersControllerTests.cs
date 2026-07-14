using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class OrdersControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        public OrdersControllerTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetOrders_ReturnsOkWithPaginatedJson()
        {
            var response = await _client.GetAsync("/api/orders?page=1&pageSize=20");

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
        public async Task GetOrder_WithValidId_ReturnsOkWithCorrectFields()
        {
            var response = await _client.GetAsync("/api/orders/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("orderId", out _));
            Assert.True(root.TryGetProperty("customerName", out _));
            Assert.True(root.TryGetProperty("lines", out _));
        }

        [Fact]
        public async Task GetOrder_WithNonExistentId_Returns404WithError()
        {
            var response = await _client.GetAsync("/api/orders/999999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetOrder_WithMalformedId_Returns400WithError()
        {
            var response = await _client.GetAsync("/api/orders/abc");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetOrdersLookup_ReturnsJsonArrayWithIdAndName()
        {
            var response = await _client.GetAsync("/api/orders/lookup");

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
