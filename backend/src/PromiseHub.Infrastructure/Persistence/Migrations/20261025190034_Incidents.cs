using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class Incidents : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "Incidents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Category = table.Column<string>(type: "TEXT", maxLength: 30, nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: false),
                    OccurredAt = table.Column<long>(type: "INTEGER", nullable: false),
                    Place = table.Column<string>(type: "TEXT", maxLength: 100, nullable: false),
                    WhatHappened = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    ActionTaken = table.Column<string>(type: "TEXT", maxLength: 4000, nullable: false),
                    GuardianContact = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Severity = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    ReporterId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ReportedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    ReportedAt = table.Column<long>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Incidents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_Incidents_Children_ChildId",
                        column: x => x.ChildId,
                        principalTable: "Children",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_Incidents_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_ChildId",
                table: "Incidents",
                column: "ChildId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_OrganizationId",
                table: "Incidents",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_Incidents_ReporterId",
                table: "Incidents",
                column: "ReporterId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "Incidents");
        }
    }
}
