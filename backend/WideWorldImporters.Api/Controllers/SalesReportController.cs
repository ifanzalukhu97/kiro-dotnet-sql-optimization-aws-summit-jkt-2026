using System;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Data;
using WideWorldImporters.Api.Models.Dtos;

namespace WideWorldImporters.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class SalesReportController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public SalesReportController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<SalesReportItemDto>>> GetSalesReport(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string customerId = null,
            [FromQuery] string stockItemId = null,
            [FromQuery] string startDate = null,
            [FromQuery] string endDate = null,
            [FromQuery] string sortBy = null,
            [FromQuery] string sortDirection = "asc",
            [FromQuery] string search = null)
        {
            if (pageSize < 1) pageSize = 1;
            if (pageSize > 100) pageSize = 100;
            if (page < 1) page = 1;

            DateTime? parsedStartDate = null;
            DateTime? parsedEndDate = null;

            if (!string.IsNullOrEmpty(startDate))
            {
                if (!DateTime.TryParse(startDate, out var sd))
                {
                    return BadRequest(new { error = "Invalid date format for startDate" });
                }
                parsedStartDate = sd;
            }

            if (!string.IsNullOrEmpty(endDate))
            {
                if (!DateTime.TryParse(endDate, out var ed))
                {
                    return BadRequest(new { error = "Invalid date format for endDate" });
                }
                parsedEndDate = ed;
            }

            // Join InvoiceLines → Invoices → Customers → StockItems
            // Filter by date range (InvoiceDate) AND customerId AND/OR stockItemId
            // These combined filter columns don't have a composite index,
            // resulting in table scans on large InvoiceLines table (~200K+ rows)
            var query = _context.InvoiceLines
                .Join(
                    _context.Invoices,
                    il => il.InvoiceID,
                    i => i.InvoiceID,
                    (il, i) => new { InvoiceLine = il, Invoice = i })
                .Join(
                    _context.Customers,
                    x => x.Invoice.CustomerID,
                    c => c.CustomerID,
                    (x, c) => new { x.InvoiceLine, x.Invoice, Customer = c })
                .Join(
                    _context.StockItems,
                    x => x.InvoiceLine.StockItemID,
                    si => si.StockItemID,
                    (x, si) => new { x.InvoiceLine, x.Invoice, x.Customer, StockItem = si });

            if (parsedStartDate.HasValue)
            {
                query = query.Where(x => x.Invoice.InvoiceDate >= parsedStartDate.Value);
            }

            if (parsedEndDate.HasValue)
            {
                query = query.Where(x => x.Invoice.InvoiceDate <= parsedEndDate.Value);
            }

            if (!string.IsNullOrWhiteSpace(customerId))
            {
                var ids = customerId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(x => ids.Contains(x.Invoice.CustomerID));
                }
            }

            if (!string.IsNullOrWhiteSpace(stockItemId))
            {
                var ids = stockItemId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(x => ids.Contains(x.InvoiceLine.StockItemID));
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x => x.Customer.CustomerName.Contains(search) || x.StockItem.StockItemName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var desc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);
            var orderedQuery = sortBy?.ToLowerInvariant() switch
            {
                "invoicelineid" => desc ? query.OrderByDescending(x => x.InvoiceLine.InvoiceLineID) : query.OrderBy(x => x.InvoiceLine.InvoiceLineID),
                "invoicedate" => desc ? query.OrderByDescending(x => x.Invoice.InvoiceDate) : query.OrderBy(x => x.Invoice.InvoiceDate),
                "customername" => desc ? query.OrderByDescending(x => x.Customer.CustomerName) : query.OrderBy(x => x.Customer.CustomerName),
                "stockitemname" => desc ? query.OrderByDescending(x => x.StockItem.StockItemName) : query.OrderBy(x => x.StockItem.StockItemName),
                "quantity" => desc ? query.OrderByDescending(x => x.InvoiceLine.Quantity) : query.OrderBy(x => x.InvoiceLine.Quantity),
                "unitprice" => desc ? query.OrderByDescending(x => x.InvoiceLine.UnitPrice) : query.OrderBy(x => x.InvoiceLine.UnitPrice),
                "extendedprice" => desc ? query.OrderByDescending(x => x.InvoiceLine.ExtendedPrice) : query.OrderBy(x => x.InvoiceLine.ExtendedPrice),
                _ => query.OrderByDescending(x => x.Invoice.InvoiceDate)
            };

            var items = await orderedQuery
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(x => new SalesReportItemDto
                {
                    InvoiceLineId = x.InvoiceLine.InvoiceLineID,
                    InvoiceDate = x.Invoice.InvoiceDate,
                    CustomerName = x.Customer.CustomerName,
                    StockItemName = x.StockItem.StockItemName,
                    Quantity = x.InvoiceLine.Quantity,
                    UnitPrice = x.InvoiceLine.UnitPrice,
                    ExtendedPrice = x.InvoiceLine.ExtendedPrice
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<SalesReportItemDto>
            {
                Data = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }
    }
}
