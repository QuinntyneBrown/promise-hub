using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AssignedWork : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "AssignedWork",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ItemId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ProgramId = table.Column<Guid>(type: "TEXT", nullable: true),
                    DueOn = table.Column<DateOnly>(type: "TEXT", nullable: false),
                    Message = table.Column<string>(type: "TEXT", maxLength: 500, nullable: true),
                    AssignedByMembershipId = table.Column<Guid>(type: "TEXT", nullable: false),
                    AssignedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AssignedWork", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AssignedWork_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssignedWork_Memberships_AssignedByMembershipId",
                        column: x => x.AssignedByMembershipId,
                        principalTable: "Memberships",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssignedWork_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AssignedWork_Programs_ProgramId",
                        column: x => x.ProgramId,
                        principalTable: "Programs",
                        principalColumn: "Id");
                });

            migrationBuilder.CreateIndex(
                name: "IX_AssignedWork_AssignedByMembershipId",
                table: "AssignedWork",
                column: "AssignedByMembershipId");

            migrationBuilder.CreateIndex(
                name: "IX_AssignedWork_ChildId",
                table: "AssignedWork",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_AssignedWork_OrganizationId",
                table: "AssignedWork",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_AssignedWork_OrganizationId_ChildId_Kind_ItemId",
                table: "AssignedWork",
                columns: new[] { "OrganizationId", "ChildId", "Kind", "ItemId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AssignedWork_ProgramId",
                table: "AssignedWork",
                column: "ProgramId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AssignedWork");
        }
    }
}
