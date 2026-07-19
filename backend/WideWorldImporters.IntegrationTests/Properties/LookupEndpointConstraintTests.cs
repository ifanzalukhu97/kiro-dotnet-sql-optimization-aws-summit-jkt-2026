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
    /// Validates: Requirements 3.6, 13.10
    /// </summary>
    public class LookupEndpointConstraintTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        private static readonly string[] LookupEndpoints = new[]
        {
            "/api/orders/lookup",
            "/api/stockitems/lookup",
            "/api/suppliers/lookup",
            "/api/delivery/lookup",
            "/api/payment/lookup",
            "/api/productsearch/suppliers-lookup",
            "/api/productsearch/stockgroups-lookup"
        };

        public LookupEndpointConstraintTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // Feature: demo-booth-aws-summit-jkt-2026, Property 5: Lookup endpoint size and shape constraint
        [Property(MaxTest = 100)]
        public Property LookupEndpoints_ReturnArrayWithin1000Items_EachHavingNumericIdAndNonEmptyName()
        {
            var endpointIndexGen = Gen.Choose(0, LookupEndpoints.Length - 1);

            return Prop.ForAll(endpointIndexGen.ToArbitrary(), endpointIndex =>
            {
                var endpoint = LookupEndpoints[endpointIndex];
                return VerifyLookupConstraints(endpoint).GetAwaiter().GetResult();
            });
        }

        private async Task<bool> VerifyLookupConstraints(string endpoint)
        {
            var response = await _client.GetAsync(endpoint);

            // Must return HTTP 200
            if (response.StatusCode != HttpStatusCode.OK)
                return false;

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            // Must be a JSON array
            if (root.ValueKind != JsonValueKind.Array)
                return false;

            // Array must have ≤ 1000 items
            var length = root.GetArrayLength();
            if (length > 1000)
                return false;

            // Each item must have numeric id and non-empty string name
            foreach (var item in root.EnumerateArray())
            {
                if (!item.TryGetProperty("id", out var idElement))
                    return false;
                if (idElement.ValueKind != JsonValueKind.Number || !idElement.TryGetInt32(out _))
                    return false;

                if (!item.TryGetProperty("name", out var nameElement))
                    return false;
                if (nameElement.ValueKind != JsonValueKind.String)
                    return false;
                if (string.IsNullOrEmpty(nameElement.GetString()))
                    return false;
            }

            return true;
        }
    }
}
