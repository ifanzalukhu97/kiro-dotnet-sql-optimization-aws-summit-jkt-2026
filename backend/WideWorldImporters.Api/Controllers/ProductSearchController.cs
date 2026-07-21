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
    public class ProductSearchController : ControllerBase
    {
        private readonly WideWorldImportersContext _context;

        public ProductSearchController(WideWorldImportersContext context)
        {
            _context = context;
        }

        [HttpGet]
        public async Task<ActionResult<PaginatedResponse<ProductSearchItemDto>>> GetProducts(
            [FromQuery] int page = 1,
            [FromQuery] int pageSize = 20,
            [FromQuery] string supplierId = null,
            [FromQuery] string stockGroupId = null,
            [FromQuery] decimal? minPrice = null,
            [FromQuery] decimal? maxPrice = null,
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

            if (minPrice.HasValue && maxPrice.HasValue && minPrice.Value > maxPrice.Value)
            {
                return BadRequest(new { error = "minPrice cannot be greater than maxPrice" });
            }

            // Join StockItems → StockItemStockGroups → StockGroups → Suppliers
            // Filter by supplier, category (stock group), and price range
            // These combined filter columns don't have a composite index,
            // resulting in table scans when multiple filters are applied
            var query = _context.StockItems
                .Join(
                    _context.StockItemStockGroups,
                    si => si.StockItemID,
                    sisg => sisg.StockItemID,
                    (si, sisg) => new { StockItem = si, StockItemStockGroup = sisg })
                .Join(
                    _context.StockGroups,
                    x => x.StockItemStockGroup.StockGroupID,
                    sg => sg.StockGroupID,
                    (x, sg) => new { x.StockItem, x.StockItemStockGroup, StockGroup = sg })
                .Join(
                    _context.Suppliers,
                    x => x.StockItem.SupplierID,
                    s => s.SupplierID,
                    (x, s) => new { x.StockItem, x.StockItemStockGroup, x.StockGroup, Supplier = s });

            if (!string.IsNullOrWhiteSpace(supplierId))
            {
                var ids = supplierId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(x => ids.Contains(x.StockItem.SupplierID));
                }
            }

            if (!string.IsNullOrWhiteSpace(stockGroupId))
            {
                var ids = stockGroupId.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(s => int.TryParse(s.Trim(), out var id) ? id : (int?)null)
                    .Where(id => id.HasValue)
                    .Select(id => id.Value)
                    .ToList();
                if (ids.Any())
                {
                    query = query.Where(x => ids.Contains(x.StockGroup.StockGroupID));
                }
            }

            if (minPrice.HasValue)
            {
                query = query.Where(x => x.StockItem.UnitPrice >= minPrice.Value);
            }

            if (maxPrice.HasValue)
            {
                query = query.Where(x => x.StockItem.UnitPrice <= maxPrice.Value);
            }

            if (!string.IsNullOrWhiteSpace(search))
            {
                query = query.Where(x => x.StockItem.StockItemName.Contains(search) || x.Supplier.SupplierName.Contains(search) || x.StockGroup.StockGroupName.Contains(search));
            }

            var totalCount = await query.CountAsync();

            var desc = string.Equals(sortDirection, "desc", System.StringComparison.OrdinalIgnoreCase);
            var orderedQuery = sortBy?.ToLowerInvariant() switch
            {
                "stockitemid" => desc ? query.OrderByDescending(x => x.StockItem.StockItemID) : query.OrderBy(x => x.StockItem.StockItemID),
                "stockitemname" => desc ? query.OrderByDescending(x => x.StockItem.StockItemName) : query.OrderBy(x => x.StockItem.StockItemName),
                "suppliername" => desc ? query.OrderByDescending(x => x.Supplier.SupplierName) : query.OrderBy(x => x.Supplier.SupplierName),
                "stockgroupname" => desc ? query.OrderByDescending(x => x.StockGroup.StockGroupName) : query.OrderBy(x => x.StockGroup.StockGroupName),
                "unitprice" => desc ? query.OrderByDescending(x => x.StockItem.UnitPrice) : query.OrderBy(x => x.StockItem.UnitPrice),
                "recommendedretailprice" => desc ? query.OrderByDescending(x => x.StockItem.RecommendedRetailPrice) : query.OrderBy(x => x.StockItem.RecommendedRetailPrice),
                _ => query.OrderBy(x => x.StockItem.StockItemName)
            };

            if (export)
            {
                const int ExportRowLimit = 50_000;
                if (totalCount > ExportRowLimit)
                    return StatusCode(413, new { error = $"Export exceeds {ExportRowLimit:N0} row limit. Apply filters to reduce the result set." });
                _context.Database.SetCommandTimeout(120);
            }
            var pagedQuery = export ? orderedQuery : orderedQuery.Skip((page - 1) * pageSize).Take(pageSize);
            var items = await pagedQuery
                .Select(x => new ProductSearchItemDto
                {
                    StockItemId = x.StockItem.StockItemID,
                    StockItemName = x.StockItem.StockItemName,
                    SupplierName = x.Supplier.SupplierName,
                    StockGroupName = x.StockGroup.StockGroupName,
                    UnitPrice = x.StockItem.UnitPrice,
                    RecommendedRetailPrice = x.StockItem.RecommendedRetailPrice,
                    TaxRate = x.StockItem.TaxRate
                })
                .ToListAsync();

            return Ok(new PaginatedResponse<ProductSearchItemDto>
            {
                Data = items,
                Page = page,
                PageSize = pageSize,
                TotalCount = totalCount
            });
        }

        [HttpGet("suppliers-lookup")]
        public async Task<ActionResult<List<LookupDto>>> GetSuppliersLookup()
        {
            var suppliers = await _context.Suppliers
                .OrderBy(s => s.SupplierName)
                .Take(1000)
                .Select(s => new LookupDto
                {
                    Id = s.SupplierID,
                    Name = s.SupplierName
                })
                .ToListAsync();

            return Ok(suppliers);
        }

        [HttpGet("stockgroups-lookup")]
        public async Task<ActionResult<List<LookupDto>>> GetStockGroupsLookup()
        {
            var stockGroups = await _context.StockGroups
                .OrderBy(sg => sg.StockGroupName)
                .Take(1000)
                .Select(sg => new LookupDto
                {
                    Id = sg.StockGroupID,
                    Name = sg.StockGroupName
                })
                .ToListAsync();

            return Ok(stockGroups);
        }
    }
}
