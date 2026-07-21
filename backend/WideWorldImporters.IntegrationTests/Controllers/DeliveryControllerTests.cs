using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class DeliveryControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public DeliveryControllerTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetDeliveries_ReturnsOkWithPaginatedJson()
        {
            var response = await _client.GetAsync("/api/delivery?page=1&pageSize=20");

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
        public async Task GetDelivery_WithValidId_ReturnsOkWithCorrectFields()
        {
            var response = await _client.GetAsync("/api/delivery/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("invoiceId", out _));
            Assert.True(root.TryGetProperty("customerName", out _));
            Assert.True(root.TryGetProperty("lines", out _));
        }

        [Fact]
        public async Task GetDelivery_WithNonExistentId_Returns404WithError()
        {
            var response = await _client.GetAsync("/api/delivery/999999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetDelivery_WithMalformedId_Returns400WithError()
        {
            var response = await _client.GetAsync("/api/delivery/abc");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetDelivery_ReturnsStockItemName_OnEachLine()
        {
            // Validates: Requirements 2.11
            var response = await _client.GetAsync("/api/delivery/1");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var lines = doc.RootElement.GetProperty("lines");

            Assert.True(lines.GetArrayLength() > 0, "Delivery should have at least one line");
            foreach (var line in lines.EnumerateArray())
            {
                var stockItemName = line.GetProperty("stockItemName").GetString();
                Assert.False(string.IsNullOrEmpty(stockItemName), "stockItemName should not be null or empty");
            }
        }

        [Fact]
        public async Task GetDelivery_NonProductFields_RemainCorrect()
        {
            // Validates: Requirements 3.11
            // Preservation: adding StockItemName must not break existing line fields
            var response = await _client.GetAsync("/api/delivery/1");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var lines = doc.RootElement.GetProperty("lines");

            Assert.True(lines.GetArrayLength() > 0, "Delivery should have at least one line");
            foreach (var line in lines.EnumerateArray())
            {
                Assert.True(line.TryGetProperty("description", out var desc), "description field must be present");
                Assert.False(string.IsNullOrEmpty(desc.GetString()), "description should not be empty");

                Assert.True(line.TryGetProperty("quantity", out var qty), "quantity field must be present");
                Assert.True(qty.GetInt32() > 0, "quantity should be > 0");

                Assert.True(line.TryGetProperty("unitPrice", out var up), "unitPrice field must be present");
                Assert.True(up.GetDecimal() >= 0, "unitPrice should be >= 0");

                Assert.True(line.TryGetProperty("extendedPrice", out var ep), "extendedPrice field must be present");
                Assert.True(ep.GetDecimal() >= 0, "extendedPrice should be >= 0");
            }
        }

        [Fact]
        public async Task GetDriversLookup_ReturnsJsonArrayWithIdAndName()
        {
            var response = await _client.GetAsync("/api/delivery/lookup");

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
