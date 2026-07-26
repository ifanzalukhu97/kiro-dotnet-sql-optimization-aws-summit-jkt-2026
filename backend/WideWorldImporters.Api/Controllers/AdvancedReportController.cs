using System;
using System.Collections.Generic;
using System.Globalization;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Data;
using WideWorldImporters.Api.Models.Dtos;

namespace WideWorldImporters.Api.Controllers
{
    [ApiController]
    [Route("api/advancedreport")]
    public class AdvancedReportController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public AdvancedReportController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet("total-revenue")]
        public async Task<ActionResult<TotalRevenueDto>> GetTotalRevenue()
        {
            var invoiceRevenue = await _context.InvoiceLines.SumAsync(il => il.ExtendedPrice);
            var orderRevenue = await _context.OrderLines.SumAsync(ol => ol.Quantity * ol.UnitPrice);
            var totalRevenue = invoiceRevenue + orderRevenue;

            if (totalRevenue != invoiceRevenue + orderRevenue)
                return StatusCode(500, new { error = "Revenue calculation inconsistency detected" });

            return Ok(new TotalRevenueDto
            {
                TotalRevenue = totalRevenue,
                InvoiceRevenue = invoiceRevenue,
                OrderRevenue = orderRevenue
            });
        }

        [HttpGet("top-customers")]
        public async Task<ActionResult<List<TopCustomerDto>>> GetTopCustomers()
        {
            var result = await _context.InvoiceLines
                .Include(il => il.Invoice)
                    .ThenInclude(i => i.Customer)
                .GroupBy(il => new { il.Invoice.CustomerID, il.Invoice.Customer.CustomerName })
                .Select(g => new TopCustomerDto
                {
                    CustomerId = g.Key.CustomerID,
                    CustomerName = g.Key.CustomerName,
                    TotalRevenue = g.Sum(il => il.ExtendedPrice)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(10)
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("top-salesman")]
        public async Task<ActionResult<List<TopSalesmanDto>>> GetTopSalesman()
        {
            var result = await _context.InvoiceLines
                .Include(il => il.Invoice)
                    .ThenInclude(i => i.SalespersonPerson)
                .GroupBy(il => new { il.Invoice.SalespersonPersonID, il.Invoice.SalespersonPerson.FullName })
                .Select(g => new TopSalesmanDto
                {
                    PersonId = g.Key.SalespersonPersonID,
                    FullName = g.Key.FullName,
                    TotalRevenue = g.Sum(il => il.ExtendedPrice)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(10)
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("top-products")]
        public async Task<ActionResult<List<TopProductDto>>> GetTopProducts()
        {
            var result = await _context.InvoiceLines
                .Include(il => il.StockItem)
                .GroupBy(il => new { il.StockItemID, il.StockItem.StockItemName })
                .Select(g => new TopProductDto
                {
                    StockItemId = g.Key.StockItemID,
                    StockItemName = g.Key.StockItemName,
                    TotalRevenue = g.Sum(il => il.ExtendedPrice),
                    TotalQuantitySold = g.Sum(il => il.Quantity)
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(10)
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("customer-activity")]
        public async Task<ActionResult<CustomerActivityDto>> GetCustomerActivity()
        {
            var totalCustomers = await _context.Customers.CountAsync();
            var ninetyDaysAgo = DateTime.UtcNow.AddDays(-90);
            var activeCustomers = await _context.Orders
                .Where(o => o.OrderDate >= ninetyDaysAgo)
                .Select(o => o.CustomerID)
                .Distinct()
                .CountAsync();
            var inactiveCustomers = totalCustomers - activeCustomers;
            var activePercentage = totalCustomers == 0
                ? 0m
                : Math.Round((decimal)activeCustomers / totalCustomers * 100, 2);

            return Ok(new CustomerActivityDto
            {
                TotalCustomers = totalCustomers,
                ActiveCustomers = activeCustomers,
                InactiveCustomers = inactiveCustomers,
                ActivePercentage = activePercentage
            });
        }

        [HttpGet("top-outstanding")]
        public async Task<ActionResult<List<TopOutstandingDto>>> GetTopOutstanding()
        {
            var result = await _context.CustomerTransactions
                .GroupBy(ct => ct.CustomerID)
                .Select(g => new { CustomerID = g.Key, Balance = g.Sum(ct => ct.OutstandingBalance) })
                .Where(x => x.Balance > 0)
                .OrderByDescending(x => x.Balance)
                .Take(10)
                .Join(_context.Customers,
                    x => x.CustomerID,
                    c => c.CustomerID,
                    (x, c) => new TopOutstandingDto
                    {
                        CustomerId = x.CustomerID,
                        CustomerName = c.CustomerName,
                        OutstandingBalance = x.Balance
                    })
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("dormant-customers")]
        public async Task<ActionResult<List<DormantCustomerDto>>> GetDormantCustomers()
        {
            var result = await _context.Orders
                .GroupBy(o => o.CustomerID)
                .Select(g => new { CustomerID = g.Key, LastOrderDate = g.Max(o => o.OrderDate) })
                .OrderBy(x => x.LastOrderDate)
                .Take(10)
                .Join(_context.Customers,
                    x => x.CustomerID,
                    c => c.CustomerID,
                    (x, c) => new DormantCustomerDto
                    {
                        CustomerId = x.CustomerID,
                        CustomerName = c.CustomerName,
                        LastOrderDate = x.LastOrderDate,
                        DaysSinceLastOrder = (int)(DateTime.UtcNow - x.LastOrderDate).TotalDays
                    })
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("sales-trend")]
        public async Task<ActionResult<List<SalesTrendDto>>> GetSalesTrend([FromQuery] string period = "month")
        {
            List<SalesTrendDto> result;

            if (period == "week")
            {
                var twelveWeeksAgo = DateTime.UtcNow.AddDays(-84);

                // Use DayOfYear / 7 as EF Core 5 cannot translate ISOWeek.GetWeekOfYear to SQL
                var revenue = await _context.InvoiceLines
                    .Include(il => il.Invoice)
                    .Where(il => il.Invoice.InvoiceDate >= twelveWeeksAgo)
                    .GroupBy(il => new
                    {
                        Year = il.Invoice.InvoiceDate.Year,
                        Week = (il.Invoice.InvoiceDate.DayOfYear - 1) / 7 + 1
                    })
                    .Select(g => new
                    {
                        g.Key.Year,
                        g.Key.Week,
                        Revenue = g.Sum(il => il.ExtendedPrice)
                    })
                    .ToListAsync();

                var orderCounts = await _context.Orders
                    .Where(o => o.OrderDate >= twelveWeeksAgo)
                    .GroupBy(o => new
                    {
                        Year = o.OrderDate.Year,
                        Week = (o.OrderDate.DayOfYear - 1) / 7 + 1
                    })
                    .Select(g => new
                    {
                        g.Key.Year,
                        g.Key.Week,
                        OrderCount = g.Count()
                    })
                    .ToListAsync();

                result = revenue
                    .GroupJoin(orderCounts,
                        r => new { r.Year, r.Week },
                        o => new { o.Year, o.Week },
                        (r, oc) => new SalesTrendDto
                        {
                            PeriodLabel = $"{r.Year}-W{r.Week:D2}",
                            Revenue = r.Revenue,
                            OrderCount = oc.FirstOrDefault()?.OrderCount ?? 0
                        })
                    .OrderBy(x => x.PeriodLabel)
                    .ToList();
            }
            else if (period == "year")
            {
                var revenue = await _context.InvoiceLines
                    .Include(il => il.Invoice)
                    .GroupBy(il => il.Invoice.InvoiceDate.Year)
                    .Select(g => new
                    {
                        Year = g.Key,
                        Revenue = g.Sum(il => il.ExtendedPrice)
                    })
                    .ToListAsync();

                var orderCounts = await _context.Orders
                    .GroupBy(o => o.OrderDate.Year)
                    .Select(g => new
                    {
                        Year = g.Key,
                        OrderCount = g.Count()
                    })
                    .ToListAsync();

                result = revenue
                    .GroupJoin(orderCounts,
                        r => r.Year,
                        o => o.Year,
                        (r, oc) => new SalesTrendDto
                        {
                            PeriodLabel = r.Year.ToString(),
                            Revenue = r.Revenue,
                            OrderCount = oc.FirstOrDefault()?.OrderCount ?? 0
                        })
                    .OrderBy(x => x.PeriodLabel)
                    .ToList();
            }
            else // month
            {
                var twelveMonthsAgo = DateTime.UtcNow.AddMonths(-12);

                var revenue = await _context.InvoiceLines
                    .Include(il => il.Invoice)
                    .Where(il => il.Invoice.InvoiceDate >= twelveMonthsAgo)
                    .GroupBy(il => new { il.Invoice.InvoiceDate.Year, il.Invoice.InvoiceDate.Month })
                    .Select(g => new
                    {
                        g.Key.Year,
                        g.Key.Month,
                        Revenue = g.Sum(il => il.ExtendedPrice)
                    })
                    .ToListAsync();

                var orderCounts = await _context.Orders
                    .Where(o => o.OrderDate >= twelveMonthsAgo)
                    .GroupBy(o => new { o.OrderDate.Year, o.OrderDate.Month })
                    .Select(g => new
                    {
                        g.Key.Year,
                        g.Key.Month,
                        OrderCount = g.Count()
                    })
                    .ToListAsync();

                result = revenue
                    .GroupJoin(orderCounts,
                        r => new { r.Year, r.Month },
                        o => new { o.Year, o.Month },
                        (r, oc) => new SalesTrendDto
                        {
                            PeriodLabel = $"{r.Year}-{r.Month:D2}",
                            Revenue = r.Revenue,
                            OrderCount = oc.FirstOrDefault()?.OrderCount ?? 0
                        })
                    .OrderBy(x => x.PeriodLabel)
                    .ToList();
            }

            return Ok(result);
        }

        [HttpGet("low-stock")]
        public async Task<ActionResult<List<StockLevelDto>>> GetLowStock()
        {
            // Phase 1: items where QuantityOnHand <= ReorderLevel
            var criticalItems = await _context.StockItemHoldings
                .Include(h => h.StockItem)
                .Where(h => h.QuantityOnHand <= h.ReorderLevel)
                .OrderBy(h => h.QuantityOnHand)
                .Select(h => new StockLevelDto
                {
                    StockItemId = h.StockItemID,
                    StockItemName = h.StockItem.StockItemName,
                    QuantityOnHand = h.QuantityOnHand,
                    ReorderLevel = h.ReorderLevel,
                    TargetStockLevel = h.TargetStockLevel
                })
                .Take(10)
                .ToListAsync();

            if (criticalItems.Count >= 10)
                return Ok(criticalItems);

            // Phase 2: fill remaining from items NOT in Phase 1
            var criticalIds = criticalItems.Select(c => c.StockItemId).ToList();
            var remaining = 10 - criticalItems.Count;

            var fillerItems = await _context.StockItemHoldings
                .Include(h => h.StockItem)
                .Where(h => h.QuantityOnHand > h.ReorderLevel && !criticalIds.Contains(h.StockItemID))
                .OrderBy(h => h.QuantityOnHand)
                .Select(h => new StockLevelDto
                {
                    StockItemId = h.StockItemID,
                    StockItemName = h.StockItem.StockItemName,
                    QuantityOnHand = h.QuantityOnHand,
                    ReorderLevel = h.ReorderLevel,
                    TargetStockLevel = h.TargetStockLevel
                })
                .Take(remaining)
                .ToListAsync();

            return Ok(criticalItems.Concat(fillerItems).ToList());
        }

        [HttpGet("high-stock")]
        public async Task<ActionResult<List<StockLevelDto>>> GetHighStock()
        {
            var result = await _context.StockItemHoldings
                .Include(h => h.StockItem)
                .OrderByDescending(h => h.QuantityOnHand)
                .Take(10)
                .Select(h => new StockLevelDto
                {
                    StockItemId = h.StockItemID,
                    StockItemName = h.StockItem.StockItemName,
                    QuantityOnHand = h.QuantityOnHand,
                    ReorderLevel = h.ReorderLevel,
                    TargetStockLevel = h.TargetStockLevel
                })
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("top-stock-groups")]
        public async Task<ActionResult<List<TopStockGroupDto>>> GetTopStockGroups()
        {
            var result = await _context.InvoiceLines
                .Join(_context.StockItemStockGroups,
                    il => il.StockItemID,
                    sisg => sisg.StockItemID,
                    (il, sisg) => new { il.ExtendedPrice, sisg.StockGroupID, sisg.StockItemID })
                .Join(_context.StockGroups,
                    x => x.StockGroupID,
                    sg => sg.StockGroupID,
                    (x, sg) => new { x.ExtendedPrice, x.StockGroupID, sg.StockGroupName, x.StockItemID })
                .GroupBy(x => new { x.StockGroupID, x.StockGroupName })
                .Select(g => new TopStockGroupDto
                {
                    StockGroupId = g.Key.StockGroupID,
                    StockGroupName = g.Key.StockGroupName,
                    TotalRevenue = g.Sum(x => x.ExtendedPrice),
                    ProductCount = g.Select(x => x.StockItemID).Distinct().Count()
                })
                .OrderByDescending(x => x.TotalRevenue)
                .Take(5)
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("top-suppliers")]
        public async Task<ActionResult<List<TopSupplierDto>>> GetTopSuppliers()
        {
            var result = await _context.InvoiceLines
                .Join(_context.StockItems,
                    il => il.StockItemID,
                    si => si.StockItemID,
                    (il, si) => new { il.ExtendedPrice, si.SupplierID, il.StockItemID })
                .Join(_context.Suppliers,
                    x => x.SupplierID,
                    s => s.SupplierID,
                    (x, s) => new { x.ExtendedPrice, x.SupplierID, s.SupplierName, x.StockItemID })
                .GroupBy(x => new { x.SupplierID, x.SupplierName })
                .Select(g => new TopSupplierDto
                {
                    SupplierId = g.Key.SupplierID,
                    SupplierName = g.Key.SupplierName,
                    TotalRevenue = g.Sum(x => x.ExtendedPrice),
                    ProductCount = g.Select(x => x.StockItemID).Distinct().Count()
                })
                .Where(x => x.TotalRevenue > 0)
                .OrderByDescending(x => x.TotalRevenue)
                .ThenBy(x => x.SupplierId)
                .Take(5)
                .ToListAsync();

            return Ok(result);
        }

        [HttpGet("top-drivers")]
        public async Task<ActionResult<List<TopDriverDto>>> GetTopDrivers()
        {
            var driverDeliveries = await _context.Invoices
                .Join(_context.People.Where(p => p.IsEmployee),
                    i => i.PackedByPersonID,
                    p => p.PersonID,
                    (i, p) => new { i.InvoiceID, p.PersonID, p.FullName })
                .GroupBy(x => new { x.PersonID, x.FullName })
                .Select(g => new
                {
                    g.Key.PersonID,
                    g.Key.FullName,
                    DeliveryCount = g.Count()
                })
                .OrderByDescending(x => x.DeliveryCount)
                .Take(5)
                .ToListAsync();

            var driverIds = driverDeliveries.Select(d => d.PersonID).ToList();

            var revenueByDriver = await _context.Invoices
                .Where(i => driverIds.Contains(i.PackedByPersonID))
                .Join(_context.InvoiceLines,
                    i => i.InvoiceID,
                    il => il.InvoiceID,
                    (i, il) => new { i.PackedByPersonID, il.ExtendedPrice })
                .GroupBy(x => x.PackedByPersonID)
                .Select(g => new { PersonID = g.Key, TotalRevenue = g.Sum(x => x.ExtendedPrice) })
                .ToListAsync();

            var result = driverDeliveries.Select(d => new TopDriverDto
            {
                PersonId = d.PersonID,
                FullName = d.FullName,
                DeliveryCount = d.DeliveryCount,
                TotalRevenueDelivered = revenueByDriver.FirstOrDefault(r => r.PersonID == d.PersonID)?.TotalRevenue ?? 0
            }).ToList();

            return Ok(result);
        }
    }
}
