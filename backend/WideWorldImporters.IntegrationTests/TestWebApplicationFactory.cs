using System;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.Extensions.Configuration;

namespace WideWorldImporters.IntegrationTests
{
    public class TestWebApplicationFactory : WebApplicationFactory<WideWorldImporters.Api.Startup>
    {
        protected override void ConfigureWebHost(IWebHostBuilder builder)
        {
            builder.ConfigureAppConfiguration((context, config) =>
            {
                // Use the same connection string resolution as the main app:
                // environment variables first, then appsettings fallback.
                // Tests rely on CONNECTION_STRING or ConnectionStrings__DefaultConnection
                // environment variables being set, or appsettings.json containing a valid
                // connection string pointing to a real SQL Server instance.

                config.AddJsonFile("appsettings.json", optional: true)
                      .AddJsonFile("appsettings.Development.json", optional: true)
                      .AddEnvironmentVariables();
            });

            builder.UseEnvironment("Development");
        }
    }
}
