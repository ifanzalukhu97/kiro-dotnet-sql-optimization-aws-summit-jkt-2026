using System;
using System.IO;
using FsCheck;
using FsCheck.Xunit;
using Microsoft.Data.SqlClient;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Xunit;

namespace WideWorldImporters.IntegrationTests.Properties
{
    /// <summary>
    /// Validates: Requirements 7.4
    /// </summary>
    public class DemoResetIdempotenceTests : IClassFixture<TestWebApplicationFactory>
    {
        private readonly string _connectionString;
        private readonly string _resetScript;

        // Feature: demo-booth-aws-summit-jkt-2026, Property 11: Demo reset script idempotence
        public DemoResetIdempotenceTests(TestWebApplicationFactory factory)
        {
            var configuration = factory.Services.GetRequiredService<IConfiguration>();

            _connectionString =
                Environment.GetEnvironmentVariable("CONNECTION_STRING")
                ?? Environment.GetEnvironmentVariable("ConnectionStrings__DefaultConnection")
                ?? configuration.GetConnectionString("DefaultConnection")
                ?? throw new InvalidOperationException("No connection string configured.");

            var scriptPath = Path.GetFullPath(
                Path.Combine(AppContext.BaseDirectory, "..", "..", "..", "..", "..",
                    "scripts", "reset", "demo-reset.sql"));

            _resetScript = File.ReadAllText(scriptPath);
        }

        [Property(MaxTest = 100)]
        public Property ResetScript_ExecutedNTimes_NeverThrows()
        {
            var nGen = Gen.Choose(1, 5);

            return Prop.ForAll(nGen.ToArbitrary(), n =>
            {
                for (int i = 0; i < n; i++)
                {
                    ExecuteResetScript();
                }

                AssertNoDemoIndexesExist();
            });
        }

        private void ExecuteResetScript()
        {
            // The script uses GO as batch separators; split and execute each batch.
            var batches = _resetScript.Split(
                new[] { "\nGO\n", "\nGO\r\n", "\r\nGO\r\n", "\r\nGO\n" },
                StringSplitOptions.RemoveEmptyEntries);

            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            foreach (var batch in batches)
            {
                var trimmed = batch.Trim();
                if (string.IsNullOrEmpty(trimmed))
                    continue;

                using var cmd = new SqlCommand(trimmed, connection);
                cmd.CommandTimeout = 30;
                cmd.ExecuteNonQuery();
            }
        }

        private void AssertNoDemoIndexesExist()
        {
            const string query = @"
                SELECT COUNT(*)
                FROM sys.indexes i
                INNER JOIN sys.tables t ON i.[object_id] = t.[object_id]
                WHERE i.[name] LIKE 'IX_Demo_%'
                   OR i.[name] LIKE 'IX_Optimization_%'";

            using var connection = new SqlConnection(_connectionString);
            connection.Open();

            using var cmd = new SqlCommand(query, connection);
            cmd.CommandTimeout = 10;
            var count = (int)cmd.ExecuteScalar();

            Assert.Equal(0, count);
        }
    }
}
