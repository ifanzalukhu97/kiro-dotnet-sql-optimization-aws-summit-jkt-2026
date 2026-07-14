using System.Collections.Generic;
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
            [FromQuery] int? supplierId = null)
        {
            if (pageSize < 1) pageSize = 1;
            if (pageSize > 100) pageSize = 100;
            if (page < 1) page = 1;

            var query = _context.PurchaseOrders
                .Include(po => po.Supplier)
                .Include(po => po.PurchaseOrderLines)
                .AsQueryable();

            if (supplierId.HasValue)
            {
                query = query.Where(po => po.SupplierID == supplierId.Value);
            }

            var totalCount = await query.CountAsync();

            var purchaseOrders = await query
                .OrderByDescending(po => po.OrderDate)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
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
    }
}
