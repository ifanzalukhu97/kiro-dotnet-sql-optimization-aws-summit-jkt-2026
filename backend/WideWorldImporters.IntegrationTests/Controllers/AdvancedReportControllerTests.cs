using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Controllers
{
    public class AdvancedReportControllerTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        public AdvancedReportControllerTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        [Fact]
        public async Task GetTotalRevenue_ReturnsOkWithConsistentFields()
        {
            var response = await _client.GetAsync("/api/advancedreport/total-revenue");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("totalRevenue", out var totalEl));
            Assert.True(root.TryGetProperty("invoiceRevenue", out var invoiceEl));
            Assert.True(root.TryGetProperty("orderRevenue", out var orderEl));

            var total = totalEl.GetDecimal();
            var invoice = invoiceEl.GetDecimal();
            var order = orderEl.GetDecimal();

            Assert.Equal(total, invoice + order);
            Assert.True(total >= 0);
            Assert.True(invoice >= 0);
            Assert.True(order >= 0);
        }

        [Fact]
        public async Task GetTopCustomers_ReturnsOkWithOrderedArray()
        {
            var response = await _client.GetAsync("/api/advancedreport/top-customers");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 10);

            decimal prev = decimal.MaxValue;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("customerId", out _));
                Assert.True(item.TryGetProperty("customerName", out _));
                Assert.True(item.TryGetProperty("totalRevenue", out var revEl));

                var rev = revEl.GetDecimal();
                Assert.True(rev <= prev);
                prev = rev;
            }
        }

        [Fact]
        public async Task GetTopSalesman_ReturnsOkWithOrderedArray()
        {
            var response = await _client.GetAsync("/api/advancedreport/top-salesman");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 10);

            decimal prev = decimal.MaxValue;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("personId", out _));
                Assert.True(item.TryGetProperty("fullName", out _));
                Assert.True(item.TryGetProperty("totalRevenue", out var revEl));

                var rev = revEl.GetDecimal();
                Assert.True(rev <= prev);
                prev = rev;
            }
        }

        [Fact]
        public async Task GetTopProducts_ReturnsOkWithOrderedArray()
        {
            var response = await _client.GetAsync("/api/advancedreport/top-products");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 10);

            decimal prev = decimal.MaxValue;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("stockItemId", out _));
                Assert.True(item.TryGetProperty("stockItemName", out _));
                Assert.True(item.TryGetProperty("totalRevenue", out var revEl));
                Assert.True(item.TryGetProperty("totalQuantitySold", out _));

                var rev = revEl.GetDecimal();
                Assert.True(rev <= prev);
                prev = rev;
            }
        }

        [Fact]
        public async Task GetCustomerActivity_ReturnsOkWithConsistentFields()
        {
            var response = await _client.GetAsync("/api/advancedreport/customer-activity");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.True(root.TryGetProperty("totalCustomers", out var totalEl));
            Assert.True(root.TryGetProperty("activeCustomers", out var activeEl));
            Assert.True(root.TryGetProperty("inactiveCustomers", out var inactiveEl));
            Assert.True(root.TryGetProperty("activePercentage", out var pctEl));

            var total = totalEl.GetInt32();
            var active = activeEl.GetInt32();
            var inactive = inactiveEl.GetInt32();
            var pct = pctEl.GetDecimal();

            Assert.Equal(total, active + inactive);
            Assert.True(pct >= 0 && pct <= 100);
        }

        [Fact]
        public async Task GetSalesTrend_Month_ReturnsOkWithChronologicalData()
        {
            var response = await _client.GetAsync("/api/advancedreport/sales-trend?period=month");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);

            string prevLabel = null;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("periodLabel", out var labelEl));
                Assert.True(item.TryGetProperty("revenue", out _));
                Assert.True(item.TryGetProperty("orderCount", out _));

                var label = labelEl.GetString();
                if (prevLabel != null)
                    Assert.True(string.CompareOrdinal(prevLabel, label) <= 0);
                prevLabel = label;
            }
        }

        [Fact]
        public async Task GetSalesTrend_Week_ReturnsOkWithChronologicalData()
        {
            var response = await _client.GetAsync("/api/advancedreport/sales-trend?period=week");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);

            string prevLabel = null;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("periodLabel", out var labelEl));
                Assert.True(item.TryGetProperty("revenue", out _));
                Assert.True(item.TryGetProperty("orderCount", out _));

                var label = labelEl.GetString();
                if (prevLabel != null)
                    Assert.True(string.CompareOrdinal(prevLabel, label) <= 0);
                prevLabel = label;
            }
        }

        [Fact]
        public async Task GetSalesTrend_Year_ReturnsOkWithChronologicalData()
        {
            var response = await _client.GetAsync("/api/advancedreport/sales-trend?period=year");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);

            string prevLabel = null;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("periodLabel", out var labelEl));
                Assert.True(item.TryGetProperty("revenue", out _));
                Assert.True(item.TryGetProperty("orderCount", out _));

                var label = labelEl.GetString();
                if (prevLabel != null)
                    Assert.True(string.CompareOrdinal(prevLabel, label) <= 0);
                prevLabel = label;
            }
        }

        [Fact]
        public async Task GetLowStock_ReturnsOkWithPreferentialOrder()
        {
            var response = await _client.GetAsync("/api/advancedreport/low-stock");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 10);

            bool seenAboveReorder = false;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("stockItemId", out _));
                Assert.True(item.TryGetProperty("stockItemName", out _));
                Assert.True(item.TryGetProperty("quantityOnHand", out var qtyEl));
                Assert.True(item.TryGetProperty("reorderLevel", out var reorderEl));
                Assert.True(item.TryGetProperty("targetStockLevel", out _));

                var qty = qtyEl.GetInt32();
                var reorder = reorderEl.GetInt32();

                if (qty > reorder)
                    seenAboveReorder = true;

                // Items at/below reorder must come before items above reorder
                if (!seenAboveReorder)
                    continue;
                Assert.True(qty > reorder, "Items above reorder level must not appear before items at/below reorder level");
            }
        }

        [Fact]
        public async Task GetHighStock_ReturnsOkWithDescendingOrder()
        {
            var response = await _client.GetAsync("/api/advancedreport/high-stock");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 10);

            int prev = int.MaxValue;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("stockItemId", out _));
                Assert.True(item.TryGetProperty("stockItemName", out _));
                Assert.True(item.TryGetProperty("quantityOnHand", out var qtyEl));
                Assert.True(item.TryGetProperty("reorderLevel", out _));
                Assert.True(item.TryGetProperty("targetStockLevel", out _));

                var qty = qtyEl.GetInt32();
                Assert.True(qty <= prev);
                prev = qty;
            }
        }

        [Fact]
        public async Task GetTopOutstanding_ReturnsOkWithPositiveBalances()
        {
            var response = await _client.GetAsync("/api/advancedreport/top-outstanding");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 10);

            decimal prev = decimal.MaxValue;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("customerId", out _));
                Assert.True(item.TryGetProperty("customerName", out _));
                Assert.True(item.TryGetProperty("outstandingBalance", out var balEl));

                var bal = balEl.GetDecimal();
                Assert.True(bal > 0);
                Assert.True(bal <= prev);
                prev = bal;
            }
        }

        [Fact]
        public async Task GetDormantCustomers_ReturnsOkWithAscendingOrder()
        {
            var response = await _client.GetAsync("/api/advancedreport/dormant-customers");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 10);

            string prevDate = null;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("customerId", out _));
                Assert.True(item.TryGetProperty("customerName", out _));
                Assert.True(item.TryGetProperty("lastOrderDate", out var dateEl));
                Assert.True(item.TryGetProperty("daysSinceLastOrder", out var daysEl));

                var days = daysEl.GetInt32();
                Assert.True(days > 0);

                var date = dateEl.GetString();
                if (prevDate != null)
                    Assert.True(string.CompareOrdinal(prevDate, date) <= 0);
                prevDate = date;
            }
        }

        [Fact]
        public async Task GetTopStockGroups_ReturnsOkWithOrderedArray()
        {
            var response = await _client.GetAsync("/api/advancedreport/top-stock-groups");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 5);

            decimal prev = decimal.MaxValue;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("stockGroupId", out _));
                Assert.True(item.TryGetProperty("stockGroupName", out _));
                Assert.True(item.TryGetProperty("totalRevenue", out var revEl));
                Assert.True(item.TryGetProperty("productCount", out _));

                var rev = revEl.GetDecimal();
                Assert.True(rev <= prev);
                prev = rev;
            }
        }

        [Fact]
        public async Task GetTopSuppliers_ReturnsOkWithOrderedArray()
        {
            var response = await _client.GetAsync("/api/advancedreport/top-suppliers");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 5);

            decimal prev = decimal.MaxValue;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("supplierId", out _));
                Assert.True(item.TryGetProperty("supplierName", out _));
                Assert.True(item.TryGetProperty("totalRevenue", out var revEl));
                Assert.True(item.TryGetProperty("productCount", out _));

                var rev = revEl.GetDecimal();
                Assert.True(rev > 0);
                Assert.True(rev <= prev);
                prev = rev;
            }
        }

        [Fact]
        public async Task GetTopDrivers_ReturnsOkWithOrderedArray()
        {
            var response = await _client.GetAsync("/api/advancedreport/top-drivers");
            Assert.Equal(HttpStatusCode.OK, response.StatusCode);

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            Assert.Equal(JsonValueKind.Array, root.ValueKind);
            Assert.True(root.GetArrayLength() <= 5);

            int prev = int.MaxValue;
            foreach (var item in root.EnumerateArray())
            {
                Assert.True(item.TryGetProperty("personId", out _));
                Assert.True(item.TryGetProperty("fullName", out _));
                Assert.True(item.TryGetProperty("deliveryCount", out var countEl));
                Assert.True(item.TryGetProperty("totalRevenueDelivered", out _));

                var count = countEl.GetInt32();
                Assert.True(count <= prev);
                prev = count;
            }
        }
    }
}
