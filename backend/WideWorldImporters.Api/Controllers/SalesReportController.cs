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
            [FromQuery] int? customerId = null,
            [FromQuery] int? stockItemId = null,
            [FromQuery] string startDate = null,
            [FromQuery] string endDate = null)
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

            if (customerId.HasValue)
            {
                query = query.Where(x => x.Invoice.CustomerID == customerId.Value);
            }

            if (stockItemId.HasValue)
            {
                query = query.Where(x => x.InvoiceLine.StockItemID == stockItemId.Value);
            }

            var totalCount = await query.CountAsync();

            var items = await query
                .OrderByDescending(x => x.Invoice.InvoiceDate)
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
