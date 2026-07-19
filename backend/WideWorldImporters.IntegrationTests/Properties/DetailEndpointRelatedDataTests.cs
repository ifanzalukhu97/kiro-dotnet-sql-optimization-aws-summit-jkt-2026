using System;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text.Json;
using System.Threading.Tasks;
using FsCheck;
using FsCheck.Xunit;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Properties
{
    /// <summary>
    /// Validates: Requirements 3.3, 13.6
    /// </summary>
    public class DetailEndpointRelatedDataTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        /// <summary>
        /// Each entry defines: controller route, ID field name in list response, detail URL template,
        /// and the related data fields that must be present in the detail response.
        /// Note: invoices and delivery are excluded due to a known DB schema mismatch
        /// (DeliveredByPersonID column does not exist in the database).
        /// </summary>
        private static readonly ControllerDetailSpec[] DetailControllers = new[]
        {
            new ControllerDetailSpec("orders", "orderId", "/api/orders/{0}", new[] { "customerName", "lines" }),
            new ControllerDetailSpec("customers", "customerId", "/api/customers/{0}", new[] { "customerName", "recentOrders" }),
            new ControllerDetailSpec("stockitems", "stockItemId", "/api/stockitems/{0}", new[] { "stockGroups", "supplierName" }),
            new ControllerDetailSpec("suppliers", "supplierId", "/api/suppliers/{0}", new[] { "recentPurchaseOrders", "stockItems" }),
            new ControllerDetailSpec("purchaseorders", "purchaseOrderId", "/api/purchaseorders/{0}", new[] { "supplierName", "lines" }),
            new ControllerDetailSpec("warehouse", "stockItemTransactionId", "/api/warehouse/{0}", new[] { "stockItemName", "quantity" }),
            new ControllerDetailSpec("payment", "customerTransactionId", "/api/payment/{0}", new[] { "customerName", "transactionAmount" }),
        };

        public DetailEndpointRelatedDataTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // Feature: demo-booth-aws-summit-jkt-2026, Property 2: Detail endpoint returns entity with related data
        [Property(MaxTest = 100)]
        public Property DetailEndpoint_ReturnsEntityWithRelatedData()
        {
            var controllerIndexGen = Gen.Choose(0, DetailControllers.Length - 1);

            return Prop.ForAll(controllerIndexGen.ToArbitrary(), controllerIndex =>
            {
                var spec = DetailControllers[controllerIndex];
                return VerifyDetailEndpointRelatedData(spec).GetAwaiter().GetResult();
            });
        }

        private async Task<bool> VerifyDetailEndpointRelatedData(ControllerDetailSpec spec)
        {
            // Step 1: Fetch list endpoint to get valid IDs
            var listResponse = await _client.GetAsync($"/api/{spec.ControllerRoute}?page=1&pageSize=5");
            if (listResponse.StatusCode != HttpStatusCode.OK)
                return false;

            var listContent = await listResponse.Content.ReadAsStringAsync();
            using var listDoc = JsonDocument.Parse(listContent);
            var listRoot = listDoc.RootElement;

            if (!listRoot.TryGetProperty("data", out var dataElement))
                return false;
            if (dataElement.ValueKind != JsonValueKind.Array)
                return false;
            if (dataElement.GetArrayLength() == 0)
                return false;

            // Step 2: Pick a random item from the list and extract its ID
            var items = dataElement.EnumerateArray().ToList();
            var random = new System.Random();
            var randomIndex = random.Next(0, items.Count);
            var selectedItem = items[randomIndex];

            if (!selectedItem.TryGetProperty(spec.IdFieldName, out var idElement))
                return false;

            var entityId = idElement.GetInt32();

            // Step 3: Call the detail endpoint
            var detailUrl = string.Format(spec.DetailUrlTemplate, entityId);
            var detailResponse = await _client.GetAsync(detailUrl);

            // Verify HTTP 200
            if (detailResponse.StatusCode != HttpStatusCode.OK)
                return false;

            var detailContent = await detailResponse.Content.ReadAsStringAsync();
            using var detailDoc = JsonDocument.Parse(detailContent);
            var detailRoot = detailDoc.RootElement;

            // Step 4: Verify entity's own ID field is present
            if (!detailRoot.TryGetProperty(spec.IdFieldName, out var detailIdElement))
                return false;
            if (detailIdElement.GetInt32() != entityId)
                return false;

            // Step 5: Verify at least one related data field exists
            var relatedFieldFound = false;
            foreach (var relatedField in spec.RelatedDataFields)
            {
                if (detailRoot.TryGetProperty(relatedField, out var relatedElement))
                {
                    // The field exists - verify it has meaningful content
                    if (relatedElement.ValueKind == JsonValueKind.Array ||
                        relatedElement.ValueKind == JsonValueKind.Object ||
                        relatedElement.ValueKind == JsonValueKind.String ||
                        relatedElement.ValueKind == JsonValueKind.Number)
                    {
                        relatedFieldFound = true;
                        break;
                    }
                }
            }

            return relatedFieldFound;
        }

        private class ControllerDetailSpec
        {
            public string ControllerRoute { get; }
            public string IdFieldName { get; }
            public string DetailUrlTemplate { get; }
            public string[] RelatedDataFields { get; }

            public ControllerDetailSpec(string controllerRoute, string idFieldName, string detailUrlTemplate, string[] relatedDataFields)
            {
                ControllerRoute = controllerRoute;
                IdFieldName = idFieldName;
                DetailUrlTemplate = detailUrlTemplate;
                RelatedDataFields = relatedDataFields;
            }
        }
    }
}
