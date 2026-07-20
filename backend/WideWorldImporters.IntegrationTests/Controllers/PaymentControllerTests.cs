using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class PaymentControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public PaymentControllerTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetPayments_ReturnsOkWithPaginatedJson()
        {
            var response = await _client.GetAsync("/api/payment?page=1&pageSize=20");

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
        public async Task GetPayment_WithValidId_ReturnsOkWithCorrectFields()
        {
            // First, get a valid ID from the list endpoint
            var listResponse = await _client.GetAsync("/api/payment?page=1&pageSize=1");
            var listContent = await listResponse.Content.ReadAsStringAsync();
            using var listDoc = JsonDocument.Parse(listContent);
            var firstItem = listDoc.RootElement.GetProperty("data")[0];
            var validId = firstItem.GetProperty("customerTransactionId").GetInt32();

            var response = await _client.GetAsync($"/api/payment/{validId}");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("customerTransactionId", out _));
            Assert.True(root.TryGetProperty("customerName", out _));
            Assert.True(root.TryGetProperty("transactionAmount", out _));
        }

        [Fact]
        public async Task GetPayment_WithNonExistentId_Returns404WithError()
        {
            var response = await _client.GetAsync("/api/payment/999999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetPayment_WithMalformedId_Returns400WithError()
        {
            var response = await _client.GetAsync("/api/payment/abc");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetCustomersLookup_ReturnsJsonArrayWithIdAndName()
        {
            var response = await _client.GetAsync("/api/payment/lookup");

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
