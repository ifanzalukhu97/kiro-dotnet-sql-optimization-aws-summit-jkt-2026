using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Data;
using WideWorldImporters.Api.Models.Dtos;

namespace WideWorldImporters.Api.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class DashboardController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public DashboardController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<DashboardKpiDto>> GetDashboardKpis()
        {
            // Suboptimal: Multiple separate queries instead of a single efficient query
            // Each query hits the database independently, causing multiple round trips

            // Query 1: Total orders — uses OrderByDescending before Count (forces sort on large table)
            var totalOrders = await _context.Orders
                .OrderByDescending(o => o.OrderDate)
                .CountAsync();

            // Query 2: Total customers — uses OrderByDescending before Count (unnecessary sort)
            var totalCustomers = await _context.Customers
                .OrderByDescending(c => c.CustomerID)
                .CountAsync();

            // Query 3: Total revenue — loads ALL InvoiceLines into memory then computes sum
            // This is extremely suboptimal: fetches entire table (~200K+ rows) to client memory
            var allInvoiceLines = await _context.InvoiceLines
                .OrderByDescending(il => il.InvoiceLineID)
                .ToListAsync();
            var totalRevenue = allInvoiceLines.Sum(il => il.ExtendedPrice);

            // Query 4: Total stock items — unnecessary sort before count
            var totalStockItems = await _context.StockItems
                .OrderByDescending(si => si.StockItemID)
                .CountAsync();

            // Query 5: Average order value — loads all order lines, groups in memory
            // Forces sort on OrderID and computes grouping in .NET instead of SQL
            var allOrderLines = await _context.OrderLines
                .OrderByDescending(ol => ol.OrderID)
                .ToListAsync();
            var orderTotals = allOrderLines
                .GroupBy(ol => ol.OrderID)
                .Select(g => g.Sum(ol => ol.Quantity * ol.UnitPrice))
                .ToList();
            var averageOrderValue = orderTotals.Count > 0
                ? orderTotals.Average()
                : 0m;

            // Query 6: Top customer by revenue — loads all invoice lines with joins in memory
            // Uses GroupBy producing sorts on large table
            var invoiceLinesWithCustomer = await _context.InvoiceLines
                .Join(
                    _context.Invoices,
                    il => il.InvoiceID,
                    i => i.InvoiceID,
                    (il, i) => new { il.ExtendedPrice, i.CustomerID })
                .Join(
                    _context.Customers,
                    x => x.CustomerID,
                    c => c.CustomerID,
                    (x, c) => new { x.ExtendedPrice, c.CustomerName })
                .OrderByDescending(x => x.ExtendedPrice)
                .ToListAsync();

            var topCustomerByRevenue = invoiceLinesWithCustomer
                .GroupBy(x => x.CustomerName)
                .OrderByDescending(g => g.Sum(x => x.ExtendedPrice))
                .Select(g => g.Key)
                .FirstOrDefault() ?? "N/A";

            // Query 7: Recent order count (last 30 days) — forces sort before filtering
            var thirtyDaysAgo = DateTime.UtcNow.AddDays(-30);
            var recentOrderCount = await _context.Orders
                .OrderByDescending(o => o.OrderDate)
                .Where(o => o.OrderDate >= thirtyDaysAgo)
                .CountAsync();

            // Query 8: Pending deliveries — orders past expected delivery that aren't yet delivered
            // Uses OrderByDescending on large table before filtering
            var pendingDeliveries = await _context.Orders
                .OrderByDescending(o => o.ExpectedDeliveryDate)
                .Where(o => o.ExpectedDeliveryDate < DateTime.UtcNow && o.IsUndersupplyBackordered)
                .CountAsync();

            var dto = new DashboardKpiDto
            {
                TotalOrders = totalOrders,
                TotalCustomers = totalCustomers,
                TotalRevenue = totalRevenue,
                TotalStockItems = totalStockItems,
                AverageOrderValue = averageOrderValue,
                TopCustomerByRevenue = topCustomerByRevenue,
                RecentOrderCount = recentOrderCount,
                PendingDeliveries = pendingDeliveries
            };

            return Ok(dto);
        }
    }
}
