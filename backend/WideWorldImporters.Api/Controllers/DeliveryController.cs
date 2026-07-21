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
    public class DeliveryController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public DeliveryController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<DeliveryListDto>>> GetDeliveries(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string driverId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null,
            [FromQuery] string sortBy = null,
            [FromQuery] string sortDirection = "asc",
            [FromQuery] string search = null,
            [FromQuery] bool export = false)
        {
            if (!export)
            {
                if (pageSize > 100) pageSize = 100;
                if (pageSize < 1) pageSize = 1;
            }
            if (page < 1) page = 1;

            var query = _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalespersonPerson)
                .Include(i => i.InvoiceLines)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(driverId))
            {
                var ids = driverId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(i => ids.Contains(i.SalespersonPersonID));
                }
            }

            if (startDate.HasValue)
            {
                query = query.Where(i => i.InvoiceDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(i => i.InvoiceDate <= endDate.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(i => i.Customer.CustomerName.Contains(search) || i.SalespersonPerson.FullName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var sorted = ApplySort(query, sortBy, sortDirection);
            var invoices = export
                ? await sorted.ToListAsync()
                : await sorted.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync();

            var deliveryDtos = invoices.Select(invoice => new DeliveryListDto
            {
                InvoiceId = invoice.InvoiceID,
                CustomerName = invoice.Customer?.CustomerName ?? string.Empty,
                DriverName = invoice.SalespersonPerson?.FullName ?? string.Empty,
                InvoiceDate = invoice.InvoiceDate,
                LineCount = invoice.InvoiceLines?.Count ?? 0,
                TotalAmount = invoice.InvoiceLines?.Sum(il => il.ExtendedPrice) ?? 0
            }).ToList();

            return Ok(new PaginatedResponse<DeliveryListDto>
            {
                Data = deliveryDtos,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<DeliveryDetailDto>> GetDelivery(string id)
        {
            if (!int.TryParse(id, out var invoiceId))
            {
                return BadRequest(new { error = $"Invalid identifier format: '{id}' is not a valid numeric identifier" });
            }

            var invoice = await _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalespersonPerson)
                .Include(i => i.InvoiceLines)
                .FirstOrDefaultAsync(i => i.InvoiceID == invoiceId);

            if (invoice == null)
            {
                return NotFound(new { error = $"Resource 'Delivery' with identifier '{invoiceId}' was not found" });
            }

            var stockItemIds = invoice.InvoiceLines.Select(il => il.StockItemID).Distinct().ToList();
            var stockItems = await _context.StockItems
                .Where(si => stockItemIds.Contains(si.StockItemID))
                .ToDictionaryAsync(si => si.StockItemID, si => si.StockItemName);

            var detail = new DeliveryDetailDto
            {
                InvoiceId = invoice.InvoiceID,
                CustomerName = invoice.Customer?.CustomerName ?? string.Empty,
                DriverName = invoice.SalespersonPerson?.FullName ?? string.Empty,
                InvoiceDate = invoice.InvoiceDate,
                TotalDryItems = invoice.TotalDryItems,
                TotalChillerItems = invoice.TotalChillerItems,
                Lines = invoice.InvoiceLines.Select(il => new InvoiceLineDto
                {
                    InvoiceLineId = il.InvoiceLineID,
                    StockItemId = il.StockItemID,
                    StockItemName = stockItems.GetValueOrDefault(il.StockItemID, ""),
                    Description = il.Description,
                    Quantity = il.Quantity,
                    UnitPrice = il.UnitPrice,
                    ExtendedPrice = il.ExtendedPrice
                }).ToList()
            };

            return Ok(detail);
        }

        [HttpGet("lookup")]
        public async Task<ActionResult<List<LookupDto>>> GetDrivers()
        {
            var drivers = await _context.People
                .Where(p => p.IsEmployee)
                .OrderBy(p => p.FullName)
                .Select(p => new LookupDto
                {
                    Id = p.PersonID,
                    Name = p.FullName
                })
                .Take(1000)
                .ToListAsync();

            return Ok(drivers);
        }

        private static IQueryable<Invoice> ApplySort(IQueryable<Invoice> query, string sortBy, string sortDirection)
        {
            var desc = string.Equals(sortDirection, "desc", StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLowerInvariant() switch
            {
                "invoiceid" => desc ? query.OrderByDescending(i => i.InvoiceID) : query.OrderBy(i => i.InvoiceID),
                "invoicedate" => desc ? query.OrderByDescending(i => i.InvoiceDate) : query.OrderBy(i => i.InvoiceDate),
                "customername" => desc ? query.OrderByDescending(i => i.Customer.CustomerName) : query.OrderBy(i => i.Customer.CustomerName),
                "drivername" => desc ? query.OrderByDescending(i => i.SalespersonPerson.FullName) : query.OrderBy(i => i.SalespersonPerson.FullName),
                _ => query.OrderByDescending(i => i.InvoiceDate) // default sort
            };
        }
    }
}
