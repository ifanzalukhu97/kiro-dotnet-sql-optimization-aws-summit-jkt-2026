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
    public class SuppliersController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public SuppliersController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<SupplierListDto>>> GetSuppliers(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] int? categoryId = null)
        {
            if (pageSize < 1) pageSize = 1;
            if (pageSize > 100) pageSize = 100;
            if (page < 1) page = 1;

            var query = _context.Suppliers
                .Include(s => s.SupplierCategory)
                .AsQueryable();

            if (categoryId.HasValue)
            {
                query = query.Where(s => s.SupplierCategoryID == categoryId.Value);
            }

            var totalCount = await query.CountAsync();

            var data = await query
                .OrderBy(s => s.SupplierName)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .Select(s => new SupplierListDto
                {
                    SupplierId = s.SupplierID,
                    SupplierName = s.SupplierName,
                    CategoryName = s.SupplierCategory.SupplierCategoryName,
                    PurchaseOrderCount = s.PurchaseOrders.Count(),
                    StockItemCount = _context.StockItems.Count(si => si.SupplierID == s.SupplierID)
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<SupplierListDto>
            {
                Data = data,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<SupplierDetailDto>> GetSupplier(string id)
        {
            if (!int.TryParse(id, out var supplierId))
            {
                return BadRequest(new { error = $"Invalid identifier format: '{id}' is not a valid numeric identifier" });
            }

            var supplier = await _context.Suppliers
                .Include(s => s.SupplierCategory)
                .FirstOrDefaultAsync(s => s.SupplierID == supplierId);

            if (supplier == null)
            {
                return NotFound(new { error = $"Resource 'Supplier' with identifier '{supplierId}' was not found" });
            }

            var recentPurchaseOrders = await _context.PurchaseOrders
                .Where(po => po.SupplierID == supplierId)
                .OrderByDescending(po => po.OrderDate)
                .Take(10)
                .Select(po => new PurchaseOrderListDto
                {
                    PurchaseOrderId = po.PurchaseOrderID,
                    SupplierName = supplier.SupplierName,
                    OrderDate = po.OrderDate,
                    ExpectedDeliveryDate = po.ExpectedDeliveryDate,
                    IsOrderFinalized = po.IsOrderFinalized,
                    LineCount = po.PurchaseOrderLines.Count()
                })
                .ToListAsync();

            var stockItems = await _context.StockItems
                .Where(si => si.SupplierID == supplierId)
                .Select(si => new LookupDto
                {
                    Id = si.StockItemID,
                    Name = si.StockItemName
                })
                .ToListAsync();

            var detail = new SupplierDetailDto
            {
                SupplierId = supplier.SupplierID,
                SupplierName = supplier.SupplierName,
                CategoryName = supplier.SupplierCategory?.SupplierCategoryName,
                RecentPurchaseOrders = recentPurchaseOrders,
                StockItems = stockItems
            };

            return Ok(detail);
        }

        [HttpGet("lookup")]
        public async Task<ActionResult<List<LookupDto>>> GetSupplierCategoriesLookup()
        {
            var categories = await _context.SupplierCategories
                .OrderBy(sc => sc.SupplierCategoryName)
                .Take(1000)
                .Select(sc => new LookupDto
                {
                    Id = sc.SupplierCategoryID,
                    Name = sc.SupplierCategoryName
                })
                .ToListAsync();

            return Ok(categories);
        }
    }
}
