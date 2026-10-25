using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace PromiseHub.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddAttendance : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "TimeZone",
                table: "Organizations",
                type: "TEXT",
                maxLength: 60,
                nullable: false,
                defaultValue: "");

            migrationBuilder.CreateTable(
                name: "AttendanceRecords",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildId = table.Column<Guid>(type: "TEXT", nullable: true),
                    WalkInId = table.Column<Guid>(type: "TEXT", nullable: true),
                    Status = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    CheckedInAt = table.Column<long>(type: "INTEGER", nullable: true),
                    MarkedAbsentAt = table.Column<long>(type: "INTEGER", nullable: true),
                    UpdatedBy = table.Column<string>(type: "TEXT", maxLength: 200, nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceRecords", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceRecords_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AttendanceRecords_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "WalkIns",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    EventId = table.Column<Guid>(type: "TEXT", nullable: false),
                    ChildName = table.Column<string>(type: "TEXT", maxLength: 200, nullable: false),
                    Guardian = table.Column<string>(type: "TEXT", maxLength: 300, nullable: false),
                    MedicalNotes = table.Column<string>(type: "TEXT", maxLength: 1000, nullable: true),
                    FollowUp = table.Column<bool>(type: "INTEGER", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_WalkIns", x => x.Id);
                    table.ForeignKey(
                        name: "FK_WalkIns_Events_EventId",
                        column: x => x.EventId,
                        principalTable: "Events",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_WalkIns_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "AttendanceEvents",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "TEXT", nullable: false),
                    OrganizationId = table.Column<Guid>(type: "TEXT", nullable: false),
                    RecordId = table.Column<Guid>(type: "TEXT", nullable: false),
                    Kind = table.Column<string>(type: "TEXT", maxLength: 20, nullable: false),
                    OccurredAt = table.Column<long>(type: "INTEGER", nullable: false),
                    ActorMembershipId = table.Column<Guid>(type: "TEXT", nullable: true),
                    ClientActionId = table.Column<Guid>(type: "TEXT", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_AttendanceEvents", x => x.Id);
                    table.ForeignKey(
                        name: "FK_AttendanceEvents_AttendanceRecords_RecordId",
                        column: x => x.RecordId,
                        principalTable: "AttendanceRecords",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_AttendanceEvents_Organizations_OrganizationId",
                        column: x => x.OrganizationId,
                        principalTable: "Organizations",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceEvents_OrganizationId",
                table: "AttendanceEvents",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceEvents_OrganizationId_ClientActionId",
                table: "AttendanceEvents",
                columns: new[] { "OrganizationId", "ClientActionId" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceEvents_RecordId",
                table: "AttendanceEvents",
                column: "RecordId");

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_EventId_ChildId",
                table: "AttendanceRecords",
                columns: new[] { "EventId", "ChildId" });

            migrationBuilder.CreateIndex(
                name: "IX_AttendanceRecords_OrganizationId",
                table: "AttendanceRecords",
                column: "OrganizationId");

            migrationBuilder.CreateIndex(
                name: "IX_WalkIns_EventId",
                table: "WalkIns",
                column: "EventId");

            migrationBuilder.CreateIndex(
                name: "IX_WalkIns_OrganizationId",
                table: "WalkIns",
                column: "OrganizationId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "AttendanceEvents");

            migrationBuilder.DropTable(
                name: "WalkIns");

            migrationBuilder.DropTable(
                name: "AttendanceRecords");

            migrationBuilder.DropColumn(
                name: "TimeZone",
                table: "Organizations");
        }
    }
}
