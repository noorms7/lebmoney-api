"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
async function main() {
    const system = await prisma.user.upsert({
        where: { handle: "@system" },
        update: {},
        create: {
            phone: "+961000000000",
            handle: "@system",
            name: "LEBMONEY (system)",
            wallet: {
                create: {
                    currencyAccounts: {
                        create: [
                            { currency: "USD", isPrimary: true },
                            { currency: "LBP" },
                            { currency: "EUR" },
                        ],
                    },
                },
            },
        },
    });
    const rami = await prisma.user.upsert({
        where: { handle: "@rami" },
        update: {},
        create: {
            phone: "+96131234567",
            handle: "@rami",
            name: "Rami Salameh",
            wallet: {
                create: { currencyAccounts: { create: [{ currency: "USD", isPrimary: true }] } },
            },
        },
    });
    const layal = await prisma.user.upsert({
        where: { handle: "@layal" },
        update: {},
        create: {
            phone: "+96170555123",
            handle: "@layal",
            name: "Layal Haddad",
            wallet: {
                create: { currencyAccounts: { create: [{ currency: "USD", isPrimary: true }] } },
            },
        },
    });
    const ramiWallet = await prisma.wallet.findUniqueOrThrow({
        where: { userId: rami.id },
        include: { currencyAccounts: true },
    });
    const systemWallet = await prisma.wallet.findUniqueOrThrow({
        where: { userId: system.id },
        include: { currencyAccounts: true },
    });
    const ramiUsd = ramiWallet.currencyAccounts.find((a) => a.currency === "USD");
    const systemUsd = systemWallet.currencyAccounts.find((a) => a.currency === "USD");
    const existingTopUp = await prisma.transaction.findFirst({
        where: { counterpartyLabel: "Demo seed top-up" },
    });
    if (!existingTopUp) {
        await prisma.$transaction(async (tx) => {
            const topUp = await tx.transaction.create({
                data: {
                    type: "TOP_UP",
                    status: "COMPLETED",
                    counterpartyLabel: "Demo seed top-up",
                    originalCurrency: "USD",
                    originalAmount: 500,
                    reportingCurrency: "USD",
                    convertedAmount: 500,
                },
            });
            await tx.ledgerEntry.createMany({
                data: [
                    { currencyAccountId: ramiUsd.id, transactionId: topUp.id, amount: 500, balanceAfter: 500 },
                    { currencyAccountId: systemUsd.id, transactionId: topUp.id, amount: -500, balanceAfter: -500 },
                ],
            });
        });
    }
    console.log({ system: system.handle, rami: rami.handle, layal: layal.handle });
    console.log("Seeded Rami with a $500 demo balance — try POST /transactions/send from @rami to @layal.");
    await prisma.biller.createMany({
        data: [
            { name: "EDL — Electricity", category: "Utilities" },
            { name: "Ogero — Internet", category: "Utilities" },
            { name: "Beirut Water Establishment", category: "Utilities" },
        ],
    });
    await prisma.perk.createMany({
        data: [
            { title: "5% back at Spinneys", description: "On groceries this month", cashbackPercent: 5 },
            { title: "Free delivery on Toters", description: "First 3 orders" },
        ],
    });
    await prisma.adminAccount.upsert({
        where: { email: "sarah@lebmoney.com" },
        update: {},
        create: { email: "sarah@lebmoney.com", role: "SUPER_ADMIN" },
    });
    await prisma.adminAccount.upsert({
        where: { email: "mia@lebmoney.com" },
        update: {},
        create: { email: "mia@lebmoney.com", role: "SUPPORT_AGENT" },
    });
    const existingTicket = await prisma.supportTicket.findFirst({ where: { subject: "Transfer stuck on pending" } });
    if (!existingTicket) {
        await prisma.supportTicket.create({
            data: {
                userId: layal.id,
                subject: "Transfer stuck on pending",
                status: "OPEN",
                messages: {
                    create: [{ sender: "USER", text: "It's been 2 hours and my transfer still says pending." }],
                },
            },
        });
    }
    console.log("Seeded demo billers, perks, admin accounts, and one support ticket for the Admin Dashboard.");
    const existingFlag = await prisma.transaction.findFirst({ where: { counterpartyLabel: "Demo flagged transfer" } });
    if (!existingFlag) {
        await prisma.transaction.create({
            data: {
                type: "SEND",
                status: "FLAGGED_FOR_REVIEW",
                counterpartyLabel: "Demo flagged transfer",
                originalCurrency: "USD",
                originalAmount: 480,
                reportingCurrency: "USD",
                convertedAmount: 480,
                flagged: true,
                flagReason: "Rapid repeat transfers",
            },
        });
    }
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => prisma.$disconnect());
//# sourceMappingURL=seed.js.map