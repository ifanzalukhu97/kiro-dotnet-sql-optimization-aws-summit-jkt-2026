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
    [Route("api/[controller]")]
    [ApiController]
    public class PurchaseOrdersController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public PurchaseOrdersController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<PurchaseOrderListDto>>> GetPurchaseOrders(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string supplierId = null,
            [FromQuery] string sortBy = null,
            [FromQuery] string sortDirection = "asc",
            [FromQuery] string search = null,
            [FromQuery] bool export = false)
        {
            if (!export)
            {
                if (pageSize < 1) pageSize = 1;
                if (pageSize > 100) pageSize = 100;
            }
            if (page < 1) page = 1;

            var query = _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.PurchaseOrderLines)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(supplierId))
            {
                var ids = supplierId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(po => ids.Contains(po.SupplierID));
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(po => po.Supplier.SupplierName.Contains(search) || po.PurchaseOrderLines.Any(pol => pol.StockItem.StockItemName.Contains(search)));
            }

            var totalCount = await query.CountAsync();

            var sorted = ApplySort(query, sortBy, sortDirection);
            if (export)
            {
                const int ExportRowLimit = 50_000;
                if (totalCount > ExportRowLimit)
                    return StatusCode(413, new { error = $"Export exceeds {ExportRowLimit:N0} row limit. Apply filters to reduce the result set." });
                _context.Database.SetCommandTimeout(120);
            }
            var paged = export ? sorted : sorted.Skip((page - 1) * pageSize).Take(pageSize);
            var purchaseOrders = await paged
                .Select(po => new PurchaseOrderListDto
                {
                    PurchaseOrderId = po.PurchaseOrderID,
                    SupplierName = po.Supplier.SupplierName,
                    OrderDate = po.OrderDate,
                    ExpectedDeliveryDate = po.ExpectedDeliveryDate,
                    IsOrderFinalized = po.IsOrderFinalized,
                    LineCount = po.PurchaseOrderLines.Count
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<PurchaseOrderListDto>
            {
                Data = purchaseOrders,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<PurchaseOrderDetailDto>> GetPurchaseOrder(string id)
        {
            if (!int.TryParse(id, out var purchaseOrderId))
            {
                return BadRequest(new { error = $"Invalid identifier format: '{id}' is not a valid numeric identifier" });
            }

            var purchaseOrder = await _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.PurchaseOrderLines)
                    .ThenInclude(pol => pol.StockItem)
                .FirstOrDefaultAsync(po => po.PurchaseOrderID == purchaseOrderId);

            if (purchaseOrder == null)
            {
                return NotFound(new { error = $"Resource 'PurchaseOrder' with identifier '{purchaseOrderId}' was not found" });
            }

            var dto = new PurchaseOrderDetailDto
            {
                PurchaseOrderId = purchaseOrder.PurchaseOrderID,
                SupplierName = purchaseOrder.Supplier.SupplierName,
                OrderDate = purchaseOrder.OrderDate,
                ExpectedDeliveryDate = purchaseOrder.ExpectedDeliveryDate,
                IsOrderFinalized = purchaseOrder.IsOrderFinalized,
                Lines = purchaseOrder.PurchaseOrderLines.Select(pol => new PurchaseOrderLineDto
                {
                    PurchaseOrderLineId = pol.PurchaseOrderLineID,
                    StockItemId = pol.StockItemID,
                    StockItemName = pol.StockItem.StockItemName,
                    OrderedOuters = pol.OrderedOuters,
                    ReceivedOuters = pol.ReceivedOuters,
                    ExpectedUnitPricePerOuter = pol.ExpectedUnitPricePerOuter
                }).ToList()
            };

            return Ok(dto);
        }

        private static IQueryable<PurchaseOrder> ApplySort(IQueryable<PurchaseOrder> query, string sortBy, string sortDirection)
        {
            var desc = string.Equals(sortDirection, "desc", System.StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLowerInvariant() switch
            {
                "purchaseorderid" => desc ? query.OrderByDescending(po => po.PurchaseOrderID) : query.OrderBy(po => po.PurchaseOrderID),
                "orderdate" => desc ? query.OrderByDescending(po => po.OrderDate) : query.OrderBy(po => po.OrderDate),
                "expecteddeliverydate" => desc ? query.OrderByDescending(po => po.ExpectedDeliveryDate) : query.OrderBy(po => po.ExpectedDeliveryDate),
                "suppliername" => desc ? query.OrderByDescending(po => po.Supplier.SupplierName) : query.OrderBy(po => po.Supplier.SupplierName),
                "isorderfinalized" => desc ? query.OrderByDescending(po => po.IsOrderFinalized) : query.OrderBy(po => po.IsOrderFinalized),
                _ => query.OrderByDescending(po => po.OrderDate) // default sort
            };
        }
    }
}
