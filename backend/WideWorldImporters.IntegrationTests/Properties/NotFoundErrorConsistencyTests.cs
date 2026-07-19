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
    /// Validates: Requirements 3.4, 13.7
    /// </summary>
    public class NotFoundErrorConsistencyTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        private static readonly (string Route, string ResourceType)[] DetailEndpoints = new[]
        {
            ("/api/orders/{0}", "Order"),
            ("/api/customers/{0}", "Customer"),
            ("/api/stockitems/{0}", "StockItem"),
            ("/api/invoices/{0}", "Invoice"),
            ("/api/suppliers/{0}", "Supplier"),
            ("/api/purchaseorders/{0}", "PurchaseOrder"),
            ("/api/delivery/{0}", "Delivery"),
            ("/api/warehouse/{0}", "WarehouseTransaction"),
            ("/api/payment/{0}", "Payment"),
        };

        public NotFoundErrorConsistencyTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // Feature: demo-booth-aws-summit-jkt-2026, Property 3: Error response consistency for not-found identifiers
        [Property(MaxTest = 100)]
        public Property NotFoundEndpoints_Return404WithErrorContainingResourceTypeAndIdentifier()
        {
            var idGen = Gen.Choose(900000, 999999);
            var controllerIndexGen = Gen.Choose(0, DetailEndpoints.Length - 1);

            var gen = from id in idGen
                      from controllerIndex in controllerIndexGen
                      select (id, controllerIndex);

            return Prop.ForAll(gen.ToArbitrary(), tuple =>
            {
                var (id, controllerIndex) = tuple;
                var (route, resourceType) = DetailEndpoints[controllerIndex];

                return VerifyNotFoundResponse(route, resourceType, id)
                    .GetAwaiter().GetResult();
            });
        }

        private async Task<bool> VerifyNotFoundResponse(string routeTemplate, string expectedResourceType, int id)
        {
            var url = string.Format(routeTemplate, id);
            var response = await _client.GetAsync(url);

            // Must return HTTP 404
            if (response.StatusCode != HttpStatusCode.NotFound)
                return false;

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            // Must have an "error" field
            if (!root.TryGetProperty("error", out var errorElement))
                return false;
            if (errorElement.ValueKind != JsonValueKind.String)
                return false;

            var errorMessage = errorElement.GetString();
            if (string.IsNullOrEmpty(errorMessage))
                return false;

            // Error must contain the identifier
            if (!errorMessage.Contains(id.ToString()))
                return false;

            // Error must contain the resource type
            if (!errorMessage.Contains(expectedResourceType))
                return false;

            return true;
        }
    }
}
