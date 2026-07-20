using System;
using System.Collections.Generic;
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
            [FromQuery] int? driverId = null,
            [FromQuery] DateTime? startDate = null,
            [FromQuery] DateTime? endDate = null)
        {
            if (pageSize > 100) pageSize = 100;
            if (pageSize < 1) pageSize = 1;
            if (page < 1) page = 1;

            var query = _context.Invoices
                .Include(i => i.Customer)
                .Include(i => i.SalespersonPerson)
                .Include(i => i.InvoiceLines)
                .AsQueryable();

            if (driverId.HasValue)
            {
                query = query.Where(i => i.SalespersonPersonID == driverId.Value);
            }

            if (startDate.HasValue)
            {
                query = query.Where(i => i.InvoiceDate >= startDate.Value);
            }

            if (endDate.HasValue)
            {
                query = query.Where(i => i.InvoiceDate <= endDate.Value);
            }

            var totalCount = await query.CountAsync();

            var invoices = await query
                .OrderByDescending(i => i.InvoiceDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();

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
    }
}
