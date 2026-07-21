using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Data;
using WideWorldImporters.Api.Models.Dtos;
using WideWorldImporters.Api.Models.Entities;

namespace WideWorldImporters.Api.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class InvoicesController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public InvoicesController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<InvoiceListDto>>> GetInvoices(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string customerId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string sortBy = null,
            [FromQuery] string sortDirection = "asc",
            [FromQuery] string search = null)
        {
            if (pageSize > 100) pageSize = 100;
            if (pageSize < 1) pageSize = 1;
            if (page < 1) page = 1;

            var query = _context.Invoices.AsQueryable();

            if (startDate.HasValue)
            {
                query = query.Where(i => i.InvoiceDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(i => i.InvoiceDate <= endDate.Value);
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
                    query = query.Where(i => ids.Contains(i.CustomerID));
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(i => i.Customer.CustomerName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var invoices = await ApplySort(query, sortBy, sortDirection)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

            var invoiceDtos = new List<InvoiceListDto>();
            foreach (var invoice in invoices)
            {
                var customer = await _context.Customers.FindAsync(invoice.CustomerID);
                var lineCount = await _context.InvoiceLines
                    .Where(il => il.InvoiceID == invoice.InvoiceID)
                    .CountAsync();
                var totalAmount = await _context.InvoiceLines
                    .Where(il => il.InvoiceID == invoice.InvoiceID)
                    .SumAsync(il => il.ExtendedPrice);

                invoiceDtos.Add(new InvoiceListDto
                {
                    InvoiceId = invoice.InvoiceID,
                    CustomerName = customer?.CustomerName ?? string.Empty,
                    InvoiceDate = invoice.InvoiceDate,
                    LineCount = lineCount,
                    TotalAmount = totalAmount,
                    TotalDryItems = invoice.TotalDryItems,
                    TotalChillerItems = invoice.TotalChillerItems
                });
            }

            return Ok(new PaginatedResponse<InvoiceListDto>
            {
                Data = invoiceDtos,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<InvoiceDetailDto>> GetInvoice(string id)
        {
            if (!int.TryParse(id, out var invoiceId))
            {
                return BadRequest(new { error = $"Invalid identifier format: '{id}' is not a valid numeric identifier" });
            }

            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.InvoiceLines)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId);

            if (invoice == null)
            {
                return NotFound(new { error = $"Resource 'Invoice' with identifier '{invoiceId}' was not found" });
            }

            var detail = new InvoiceDetailDto
            {
                InvoiceId = invoice.InvoiceID,
                CustomerName = invoice.Customer?.CustomerName ?? string.Empty,
                InvoiceDate = invoice.InvoiceDate,
                TotalDryItems = invoice.TotalDryItems,
                TotalChillerItems = invoice.TotalChillerItems,
                Lines = invoice.InvoiceLines.Select(il => new InvoiceLineDto
                {
                    InvoiceLineId = il.InvoiceLineID,
                    StockItemId = il.StockItemID,
                    Description = il.Description,
                    Quantity = il.Quantity,
                    UnitPrice = il.UnitPrice,
                    ExtendedPrice = il.ExtendedPrice
                }).ToList()
            };

            return Ok(detail);
        }

        private static IQueryable<Invoice> ApplySort(IQueryable<Invoice> query, string sortBy, string sortDirection)
        {
            var desc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLowerInvariant() switch
            {
                "invoiceid" => desc ? query.OrderByDescending(i => i.InvoiceID) : query.OrderBy(i => i.InvoiceID),
                "invoicedate" => desc ? query.OrderByDescending(i => i.InvoiceDate) : query.OrderBy(i => i.InvoiceDate),
                "customername" => desc ? query.OrderByDescending(i => i.Customer.CustomerName) : query.OrderBy(i => i.Customer.CustomerName),
                "totaldryitems" => desc ? query.OrderByDescending(i => i.TotalDryItems) : query.OrderBy(i => i.TotalDryItems),
                "totalchilleritems" => desc ? query.OrderByDescending(i => i.TotalChillerItems) : query.OrderBy(i => i.TotalChillerItems),
                _ => query.OrderByDescending(i => i.InvoiceDate) // default sort
            };
        }
    }
}
