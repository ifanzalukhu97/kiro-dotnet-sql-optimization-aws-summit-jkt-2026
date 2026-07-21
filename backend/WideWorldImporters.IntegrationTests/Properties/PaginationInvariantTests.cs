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
    /// Validates: Requirements 3.2, 13.5
    /// </summary>
    public class PaginationInvariantTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly HttpClient _client;
        private static readonly JsonSerializerOptions JsonOptions = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        private static readonly string[] PaginatedControllers = new[]
        {
            "orders",
            "customers",
            "stockitems",
            "invoices",
            "productsearch",
            "suppliers",
            "purchaseorders",
            "delivery",
            "warehouse",
            "payment"
        };

        public PaginationInvariantTests(TestWebApplicationFactory factory)
        {
            _client = factory.CreateClient();
        }

        // Feature: demo-booth-aws-summit-jkt-2026, Property 1: Pagination invariant
        [Property(MaxTest = 100)]
        public Property PaginationInvariant_DataLengthDoesNotExceedPageSize()
        {
            var pageGen = Gen.Choose(1, 50);
            var pageSizeGen = Gen.Choose(1, 100);
            var controllerIndexGen = Gen.Choose(0, PaginatedControllers.Length - 1);

            var gen = from page in pageGen
                      from pageSize in pageSizeGen
                      from controllerIndex in controllerIndexGen
                      select (page, pageSize, controllerIndex);

            return Prop.ForAll(gen.ToArbitrary(), tuple =>
            {
                var (page, pageSize, controllerIndex) = tuple;
                var controller = PaginatedControllers[controllerIndex];

                return VerifyPaginationInvariant(controller, page, pageSize)
                    .GetAwaiter().GetResult();
            });
        }

        private async Task<bool> VerifyPaginationInvariant(string controller, int page, int pageSize)
        {
            var response = await _client.GetAsync($"/api/{controller}?page={page}&pageSize={pageSize}");

            // Assert HTTP 200
            if (response.StatusCode != HttpStatusCode.OK)
                return false;

            var content = await response.Content.ReadAsStringAsync();
            using var doc = JsonDocument.Parse(content);
            var root = doc.RootElement;

            // Assert response contains required fields
            if (!root.TryGetProperty("data", out var dataElement))
                return false;
            if (dataElement.ValueKind != JsonValueKind.Array)
                return false;

            if (!root.TryGetProperty("page", out var pageElement))
                return false;
            if (!root.TryGetProperty("pageSize", out var pageSizeElement))
                return false;
            if (!root.TryGetProperty("totalCount", out var totalCountElement))
                return false;

            // Assert data array length <= pageSize
            var dataLength = dataElement.GetArrayLength();
            if (dataLength > pageSize)
                return false;

            // Assert page field matches requested page
            if (pageElement.GetInt32() != page)
                return false;

            // Assert pageSize field matches requested pageSize
            if (pageSizeElement.GetInt32() != pageSize)
                return false;

            // Assert totalCount is a non-negative integer
            var totalCount = totalCountElement.GetInt32();
            if (totalCount < 0)
                return false;

            return true;
        }
    }
}
