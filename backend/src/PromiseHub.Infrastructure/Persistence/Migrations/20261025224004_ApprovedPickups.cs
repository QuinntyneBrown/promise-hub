using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class ApprovedPickups : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ApprovedPickups",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    HouseholdId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Name = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Relationship = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    Mobile = table.Column<string>(type: "TEXT", maxLength: 30, nullable: true),
                    AddedByGuardian = table.Column<bool>(type: "INTEGER", nullable: false),
                    AddedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    AddedAt = table.Column<long>(type: "INTEGER", nullable: false),
                    RemovedAt = table.Column<long>(type: "INTEGER", nullable: true),
                    RemovedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ApprovedPickups", x => x.Id);
                    table.ForeignKey(
                        name: "FK_ApprovedPickups_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ApprovedPickups_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ApprovedPickups_ChildId",
                table: "ApprovedPickups",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_ApprovedPickups_OrganizationId",
                table: "ApprovedPickups",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ApprovedPickups");
        }
    }
}
