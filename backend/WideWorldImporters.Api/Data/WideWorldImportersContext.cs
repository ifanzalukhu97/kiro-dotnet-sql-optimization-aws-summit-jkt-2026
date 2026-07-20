using Microsoft.EntityFrameworkCore;
using WideWorldImporters.Api.Models.Entities;

namespace WideWorldImporters.Api.Data
{
    public class WideWorldImportersContext : DbContext
    {
        public WideWorldImportersContext(DbContextOptions<WideWorldImportersContext> options)
            : base(options)
        {
        }

        // Sales schema
        public DbSet<Order> Orders { get; set; }
        public DbSet<OrderLine> OrderLines { get; set; }
        public DbSet<Invoice> Invoices { get; set; }
        public DbSet<InvoiceLine> InvoiceLines { get; set; }
        public DbSet<Customer> Customers { get; set; }
        public DbSet<CustomerTransaction> CustomerTransactions { get; set; }

        // Purchasing schema
        public DbSet<Supplier> Suppliers { get; set; }
        public DbSet<SupplierCategory> SupplierCategories { get; set; }
        public DbSet<PurchaseOrder> PurchaseOrders { get; set; }
        public DbSet<PurchaseOrderLine> PurchaseOrderLines { get; set; }

        // Warehouse schema
        public DbSet<StockItem> StockItems { get; set; }
        public DbSet<StockItemHolding> StockItemHoldings { get; set; }
        public DbSet<StockItemStockGroup> StockItemStockGroups { get; set; }
        public DbSet<StockGroup> StockGroups { get; set; }
        public DbSet<StockItemTransaction> StockItemTransactions { get; set; }

        // Application schema
        public DbSet<Person> People { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Sales schema mappings
            modelBuilder.Entity<Order>(entity =>
            {
                entity.ToTable("Orders", "Sales");
                entity.HasKey(e => e.OrderID);

                entity.HasOne(e => e.Customer)
                    .WithMany(c => c.Orders)
                    .HasForeignKey(e => e.CustomerID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.OrderLines)
                    .WithOne(ol => ol.Order)
                    .HasForeignKey(ol => ol.OrderID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<OrderLine>(entity =>
            {
                entity.ToTable("OrderLines", "Sales");
                entity.HasKey(e => e.OrderLineID);

                entity.HasOne(e => e.StockItem)
                    .WithMany()
                    .HasForeignKey(e => e.StockItemID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Invoice>(entity =>
            {
                entity.ToTable("Invoices", "Sales");
                entity.HasKey(e => e.InvoiceID);

                entity.HasOne(e => e.Customer)
                    .WithMany(c => c.Invoices)
                    .HasForeignKey(e => e.CustomerID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.SalespersonPerson)
                    .WithMany()
                    .HasForeignKey(e => e.SalespersonPersonID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.PackedByPerson)
                    .WithMany()
                    .HasForeignKey(e => e.PackedByPersonID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.InvoiceLines)
                    .WithOne(il => il.Invoice)
                    .HasForeignKey(il => il.InvoiceID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<InvoiceLine>(entity =>
            {
                entity.ToTable("InvoiceLines", "Sales");
                entity.HasKey(e => e.InvoiceLineID);

                entity.HasOne(e => e.StockItem)
                    .WithMany()
                    .HasForeignKey(e => e.StockItemID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<Customer>(entity =>
            {
                entity.ToTable("Customers", "Sales");
                entity.HasKey(e => e.CustomerID);

                entity.HasMany(e => e.Transactions)
                    .WithOne(ct => ct.Customer)
                    .HasForeignKey(ct => ct.CustomerID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<CustomerTransaction>(entity =>
            {
                entity.ToTable("CustomerTransactions", "Sales");
                entity.HasKey(e => e.CustomerTransactionID);
            });

            // Purchasing schema mappings
            modelBuilder.Entity<Supplier>(entity =>
            {
                entity.ToTable("Suppliers", "Purchasing");
                entity.HasKey(e => e.SupplierID);

                entity.HasOne(e => e.SupplierCategory)
                    .WithMany(sc => sc.Suppliers)
                    .HasForeignKey(e => e.SupplierCategoryID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasMany(e => e.PurchaseOrders)
                    .WithOne(po => po.Supplier)
                    .HasForeignKey(po => po.SupplierID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<SupplierCategory>(entity =>
            {
                entity.ToTable("SupplierCategories", "Purchasing");
                entity.HasKey(e => e.SupplierCategoryID);
            });

            modelBuilder.Entity<PurchaseOrder>(entity =>
            {
                entity.ToTable("PurchaseOrders", "Purchasing");
                entity.HasKey(e => e.PurchaseOrderID);

                entity.HasMany(e => e.PurchaseOrderLines)
                    .WithOne(pol => pol.PurchaseOrder)
                    .HasForeignKey(pol => pol.PurchaseOrderID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<PurchaseOrderLine>(entity =>
            {
                entity.ToTable("PurchaseOrderLines", "Purchasing");
                entity.HasKey(e => e.PurchaseOrderLineID);

                entity.HasOne(e => e.StockItem)
                    .WithMany()
                    .HasForeignKey(e => e.StockItemID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Warehouse schema mappings
            modelBuilder.Entity<StockItem>(entity =>
            {
                entity.ToTable("StockItems", "Warehouse");
                entity.HasKey(e => e.StockItemID);

                entity.HasOne(e => e.Supplier)
                    .WithMany()
                    .HasForeignKey(e => e.SupplierID)
                    .OnDelete(DeleteBehavior.Restrict);

                entity.HasOne(e => e.StockItemHolding)
                    .WithOne(h => h.StockItem)
                    .HasForeignKey<StockItemHolding>(h => h.StockItemID)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasMany(e => e.StockItemStockGroups)
                    .WithOne(sg => sg.StockItem)
                    .HasForeignKey(sg => sg.StockItemID)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            modelBuilder.Entity<StockItemHolding>(entity =>
            {
                entity.ToTable("StockItemHoldings", "Warehouse");
                entity.HasKey(e => e.StockItemID);
            });

            modelBuilder.Entity<StockItemStockGroup>(entity =>
            {
                entity.ToTable("StockItemStockGroups", "Warehouse");
                entity.HasKey(e => e.StockItemStockGroupID);

                entity.HasOne(e => e.StockGroup)
                    .WithMany(sg => sg.StockItemStockGroups)
                    .HasForeignKey(e => e.StockGroupID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            modelBuilder.Entity<StockGroup>(entity =>
            {
                entity.ToTable("StockGroups", "Warehouse");
                entity.HasKey(e => e.StockGroupID);
            });

            modelBuilder.Entity<StockItemTransaction>(entity =>
            {
                entity.ToTable("StockItemTransactions", "Warehouse");
                entity.HasKey(e => e.StockItemTransactionID);

                entity.HasOne(e => e.StockItem)
                    .WithMany()
                    .HasForeignKey(e => e.StockItemID)
                    .OnDelete(DeleteBehavior.Restrict);
            });

            // Application schema mappings
            modelBuilder.Entity<Person>(entity =>
            {
                entity.ToTable("People", "Application");
                entity.HasKey(e => e.PersonID);
            });
        }
    }
}
