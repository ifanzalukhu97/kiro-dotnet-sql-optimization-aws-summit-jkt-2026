using System;
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
    /// Validates: Requirements 3.5, 13.8
    /// </summary>
    public class MalformedIdentifierErrorTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;

        private static readonly string[] DetailEndpoints = new[]
        {
            "/api/orders/{0}",
            "/api/customers/{0}",
            "/api/stockitems/{0}",
            "/api/invoices/{0}",
            "/api/suppliers/{0}",
            "/api/purchaseorders/{0}",
            "/api/delivery/{0}",
            "/api/warehouse/{0}",
            "/api/payment/{0}",
        };

        public MalformedIdentifierErrorTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // Feature: demo-booth-aws-summit-jkt-2026, Property 4: Error response consistency for malformed identifiers
        [Property(MaxTest = 100)]
        public Property MalformedIdentifiers_Return400WithErrorDescribingValidationFailure()
        {
            // Generate alphabetic strings (safe for URL path segments)
            var alphaGen = Gen.ArrayOf(Gen.Choose((int)'a', (int)'z'))
                .Select(chars => new string(Array.ConvertAll(chars, c => (char)c)))
                .Where(s => s.Length > 0);

            // Special char strings that are safe in URL path (no ?, /, #, %)
            var specialGen = Gen.Elements("abc", "xyz", "hello", "test", "null", "undefined", "NaN", "true", "false");

            // Mixed strings that look numeric but aren't valid ints (must NOT parse via int.TryParse)
            var mixedGen = Gen.Elements("3.14", "1e5", "12x", "0xFF", "1-2", "99999999999999999999", "++1", "1.0");

            var malformedGen = Gen.OneOf(alphaGen, specialGen, mixedGen)
                .Where(s => !int.TryParse(s, out _));
            var controllerIndexGen = Gen.Choose(0, DetailEndpoints.Length - 1);

            var gen = from malformedId in malformedGen
                      from controllerIndex in controllerIndexGen
                      select (malformedId, controllerIndex);

            return Prop.ForAll(gen.ToArbitrary(), tuple =>
            {
                var (malformedId, controllerIndex) = tuple;
                var route = DetailEndpoints[controllerIndex];

                return VerifyBadRequestResponse(route, malformedId)
                    .GetAwaiter().GetResult();
            });
        }

        private async Task<bool> VerifyBadRequestResponse(string routeTemplate, string malformedId)
        {
            var url = string.Format(routeTemplate, Uri.EscapeDataString(malformedId));
            var response = await _client.GetAsync(url);

            if (response.StatusCode != HttpStatusCode.BadRequest)
                return false;

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            if (!root.TryGetProperty("error", out var errorElement))
                return false;
            if (errorElement.ValueKind != JsonValueKind.String)
                return false;

            var errorMessage = errorElement.GetString();
            if (string.IsNullOrEmpty(errorMessage))
                return false;

            return true;
        }
    }
}
