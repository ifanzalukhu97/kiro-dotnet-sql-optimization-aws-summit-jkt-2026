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
            [FromQuery] string categoryId = null,
            [FromQuery] string sortBy = null,
            [FromQuery] string sortDirection = "asc",
            [FromQuery] string search = null)
        {
            if (pageSize < 1) pageSize = 1;
            if (pageSize > 100) pageSize = 100;
            if (page < 1) page = 1;

            var query = _context.Suppliers
                .Include(s => s.SupplierCategory)
                .AsQueryable();

            if (!string.IsNullOrWhiteSpace(categoryId))
            {
                var ids = categoryId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(s => ids.Contains(s.SupplierCategoryID));
                }
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(s => s.SupplierName.Contains(search) || s.SupplierCategory.SupplierCategoryName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var data = await ApplySort(query, sortBy, sortDirection)
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

        private static IQueryable<Supplier> ApplySort(IQueryable<Supplier> query, string sortBy, string sortDirection)
        {
            var desc = string.Equals(sortDirection, "desc", System.StringComparison.OrdinalIgnoreCase);

            return sortBy?.ToLowerInvariant() switch
            {
                "supplierid" => desc ? query.OrderByDescending(s => s.SupplierID) : query.OrderBy(s => s.SupplierID),
                "suppliername" => desc ? query.OrderByDescending(s => s.SupplierName) : query.OrderBy(s => s.SupplierName),
                "categoryname" => desc ? query.OrderByDescending(s => s.SupplierCategory.SupplierCategoryName) : query.OrderBy(s => s.SupplierCategory.SupplierCategoryName),
                _ => query.OrderBy(s => s.SupplierName) // default sort
            };
        }
    }
}
