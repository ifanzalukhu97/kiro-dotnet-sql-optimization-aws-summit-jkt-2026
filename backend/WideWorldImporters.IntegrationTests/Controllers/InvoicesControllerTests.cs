using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class InvoicesControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public InvoicesControllerTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetInvoices_ReturnsOkWithPaginatedJson()
        {
            var response = await _client.GetAsync("/api/invoices?page=1&pageSize=20");

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
        public async Task GetInvoice_WithValidId_ReturnsOkWithCorrectFields()
        {
            var response = await _client.GetAsync("/api/invoices/1");

            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("invoiceId", out _));
            Assert.True(root.TryGetProperty("customerName", out _));
            Assert.True(root.TryGetProperty("lines", out _));
        }

        [Fact]
        public async Task GetInvoice_WithNonExistentId_Returns404WithError()
        {
            var response = await _client.GetAsync("/api/invoices/999999");

            Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetInvoice_WithMalformedId_Returns400WithError()
        {
            var response = await _client.GetAsync("/api/invoices/abc");

            Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("error", out var errorElement));
            Assert.False(string.IsNullOrEmpty(errorElement.GetString()));
        }

        [Fact]
        public async Task GetInvoice_ReturnsStockItemName_OnEachLine()
        {
            // Validates: Requirements 2.10
            var response = await _client.GetAsync("/api/invoices/1");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var lines = doc.RootElement.GetProperty("lines");

            Assert.True(lines.GetArrayLength() > 0, "Invoice should have at least one line");
            foreach (var line in lines.EnumerateArray())
            {
                var stockItemName = line.GetProperty("stockItemName").GetString();
                Assert.False(string.IsNullOrEmpty(stockItemName), "stockItemName should not be null or empty");
            }
        }

        [Fact]
        public async Task GetInvoice_NonProductFields_RemainCorrect()
        {
            // Validates: Requirements 3.10
            // Preservation: adding StockItemName must not break existing line fields
            var response = await _client.GetAsync("/api/invoices/1");
            response.EnsureSuccessStatusCode();

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var lines = doc.RootElement.GetProperty("lines");

            Assert.True(lines.GetArrayLength() > 0, "Invoice should have at least one line");
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
    }
}
