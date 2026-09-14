import SwiftUI

struct NotificationsView: View {
    @State private var model = NotificationsViewModel()
    @State private var showAddReminder = false

    private static let weekdaySymbols = ["S", "M", "T", "W", "T", "F", "S"] // 0=Sun…6=Sat

    var body: some View {
        Form {
            if model.authStatus == .denied {
                Section {
                    Label("Notifications are turned off in iOS Settings. Enable them to receive reminders.",
                          systemImage: "bell.slash.fill")
                        .font(.footnote).foregroundStyle(.secondary)
                }
            }

            Section("Meal reminders") {
                mealRow("Breakfast", isOn: $model.breakfastEnabled, time: $model.breakfastTime)
                mealRow("Lunch", isOn: $model.lunchEnabled, time: $model.lunchTime)
                mealRow("Dinner", isOn: $model.dinnerEnabled, time: $model.dinnerTime)
            }

            Section("Water") {
                Toggle("Water reminders", isOn: $model.waterEnabled)
                    .tint(Theme.accent)
                if model.waterEnabled {
                    Picker("Every", selection: $model.waterInterval) {
                        Text("1 hour").tag(60)
                        Text("2 hours").tag(120)
                        Text("3 hours").tag(180)
                        Text("4 hours").tag(240)
                    }
                }
            }

            Section("Weigh-in") {
                Toggle("Weigh-in reminder", isOn: $model.weighInEnabled).tint(Theme.accent)
                if model.weighInEnabled {
                    DatePicker("Time", selection: $model.weighInTime, displayedComponents: .hourAndMinute)
                    weekdayPicker(selection: $model.weighInDays)
                }
            }

            Section("Quiet hours") {
                Toggle("Enable quiet hours", isOn: $model.quietEnabled).tint(Theme.accent)
                if model.quietEnabled {
                    DatePicker("From", selection: $model.quietStart, displayedComponents: .hourAndMinute)
                    DatePicker("To", selection: $model.quietEnd, displayedComponents: .hourAndMinute)
                }
            }

            Section("Custom reminders") {
                ForEach(model.reminders) { reminder in
                    VStack(alignment: .leading, spacing: 2) {
                        Text(reminder.label).font(.body)
                        Text(reminder.time).font(.caption).foregroundStyle(.secondary)
                    }
                }
                .onDelete { indexSet in
                    let toDelete = indexSet.map { model.reminders[$0] }
                    Task { for r in toDelete { await model.deleteReminder(r) } }
                }
                Button {
                    showAddReminder = true
                } label: {
                    Label("Add reminder", systemImage: "plus.circle.fill")
                }
                .tint(Theme.accent)
            }
        }
        .navigationTitle("Notifications")
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .confirmationAction) {
                Button("Save") { Task { await model.save() } }
                    .fontWeight(.semibold)
                    .disabled(model.isSaving)
            }
        }
        .sheet(isPresented: $showAddReminder) {
            AddReminderSheet { label, time, days in
                Task { await model.addReminder(label: label, time: time, days: days) }
            }
            .presentationDetents([.medium])
        }
        .task { await model.load() }
    }

    private func mealRow(_ label: String, isOn: Binding<Bool>, time: Binding<Date>) -> some View {
        VStack {
            Toggle(label, isOn: isOn).tint(Theme.accent)
            if isOn.wrappedValue {
                DatePicker("Time", selection: time, displayedComponents: .hourAndMinute)
            }
        }
    }

    private func weekdayPicker(selection: Binding<Set<Int>>) -> some View {
        HStack(spacing: 6) {
            ForEach(0..<7, id: \.self) { day in
                let selected = selection.wrappedValue.contains(day)
                Button {
                    if selected { selection.wrappedValue.remove(day) }
                    else { selection.wrappedValue.insert(day) }
                } label: {
                    Text(Self.weekdaySymbols[day])
                        .font(.subheadline.weight(.semibold))
                        .frame(width: 36, height: 36)
                        .background(selected ? Theme.accent : Color.gray.opacity(0.15), in: .circle)
                        .foregroundStyle(selected ? .white : .primary)
                }
                .buttonStyle(.plain)
            }
        }
        .frame(maxWidth: .infinity)
    }
}

/// Sheet to create a custom reminder.
private struct AddReminderSheet: View {
    var onAdd: (String, Date, Set<Int>) -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var label = ""
    @State private var time = Date()
    @State private var days: Set<Int> = Set(0..<7)

    private static let weekdaySymbols = ["S", "M", "T", "W", "T", "F", "S"]

    var body: some View {
        NavigationStack {
            Form {
                Section { TextField("Label (e.g. Take vitamins)", text: $label) }
                Section { DatePicker("Time", selection: $time, displayedComponents: .hourAndMinute) }
                Section("Repeat") {
                    HStack(spacing: 6) {
                        ForEach(0..<7, id: \.self) { day in
                            let selected = days.contains(day)
                            Button {
                                if selected { days.remove(day) } else { days.insert(day) }
                            } label: {
                                Text(Self.weekdaySymbols[day])
                                    .font(.subheadline.weight(.semibold))
                                    .frame(width: 36, height: 36)
                                    .background(selected ? Theme.accent : Color.gray.opacity(0.15), in: .circle)
                                    .foregroundStyle(selected ? .white : .primary)
                            }
                            .buttonStyle(.plain)
                        }
                    }
                    .frame(maxWidth: .infinity)
                }
            }
            .navigationTitle("New reminder")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) { Button("Cancel") { dismiss() } }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Add") {
                        onAdd(label.trimmingCharacters(in: .whitespaces), time, days)
                        dismiss()
                    }
                    .disabled(label.trimmingCharacters(in: .whitespaces).isEmpty)
                }
            }
        }
    }
}
