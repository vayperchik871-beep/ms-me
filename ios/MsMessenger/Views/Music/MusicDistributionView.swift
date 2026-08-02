import SwiftUI
import PhotosUI
import UniformTypeIdentifiers

struct MusicDistributionView: View {
    @ObservedObject private var theme = ThemeManager.shared
    @State private var artist: Artist?
    @State private var loading = true
    @State private var showArtistModal = false
    @State private var showUploadModal = false
    @State private var searchText = ""
    @State private var searchResults: MusicSearchResponse?
    var onLoaded: (() -> Void)?
    var onArtistChanged: (() -> Void)?

    var body: some View {
        VStack(spacing: 0) {
            searchBar

            if !searchText.isEmpty {
                searchResultsView
            } else if loading {
                Spacer()
                ProgressView().tint(Color(hex: "#6C63FF"))
                Text("Загрузка…")
                    .font(.system(size: 14)).foregroundColor(theme.textSecondary).padding(.top, 8)
                Spacer()
            } else if let artist {
                artistProfile(artist)
            } else {
                noArtistCard
            }
        }
        .background(theme.bgColor.ignoresSafeArea())
        .task { load() }
        .sheet(isPresented: $showArtistModal) {
            CreateArtistCardSheet { newArtist in
                artist = newArtist
                showArtistModal = false
                load()
            }
        }
        .sheet(isPresented: $showUploadModal) {
            UploadTrackModal(artistName: artist?.name ?? "") {
                showUploadModal = false
                load()
            }
        }
    }

    private var searchBar: some View {
        HStack(spacing: 8) {
            Image(systemName: "magnifyingglass")
                .foregroundColor(theme.textSecondary)
            TextField("Поиск артистов и треков…", text: $trackingText)
                .font(.system(size: 15))
                .foregroundColor(theme.inputText)
                .autocorrectionDisabled()
        }
        .padding(.horizontal, 12)
        .padding(.vertical, 10)
        .background(Color.white.opacity(0.06))
        .cornerRadius(14)
        .padding(.horizontal, 16)
        .padding(.top, 4)
        .onChange(of: searchText) { q in
            okSearch(q)
        }
    }

    private var trackingText: Binding<String> {
        Binding(
            get: { searchText },
            set: { searchText = $0 }
        )
    }

    private var searchResultsView: some View {
        ScrollView {
            LazyVStack(spacing: 8) {
                if let results = searchResults {
                    if !results.artists.isEmpty {
                        sectionHeader("Артисты")
                        ForEach(results.artists) { a in artistRow(a) }
                    }
                    if !results.tracks.isEmpty {
                        sectionHeader("Треки")
                        ForEach(results.tracks) { track in trackRow(track) }
                    }
                    if results.artists.isEmpty && results.tracks.isEmpty {
                        emptyText("Ничего не найдено")
                    }
                }
            }
            .padding(.horizontal, 16)
            .padding(.vertical, 8)
        }
    }

    private func sectionHeader(_ title: String) -> some View {
        Text(title)
            .font(.system(size: 15, weight: .semibold))
            .foregroundColor(theme.textPrimary)
            .frame(maxWidth: .infinity, alignment: .leading)
            .padding(.top, 6)
    }

    private func emptyText(_ text: String) -> some View {
        Text(text)
            .font(.system(size: 14))
            .foregroundColor(theme.textSecondary)
            .frame(maxWidth: .infinity, minHeight: 80)
    }

    private func artistRow(_ a: Artist) -> some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: a.photo ?? "")) { img in
                img.resizable().scaledToFill()
            } placeholder: {
                ZStack {
                    Circle().fill(Color.white.opacity(0.1))
                    Text(a.name.prefix(1).uppercased()).foregroundColor(Color(hex: "#6C63FF"))
                }
            }
            .frame(width: 48, height: 48)
            .clipShape(Circle())
            VStack(alignment: .leading, spacing: 2) {
                Text(a.name).font(.system(size: 15, weight: .medium)).foregroundColor(theme.textPrimary)
                Text("Артист").font(.system(size: 12)).foregroundColor(theme.textSecondary)
            }
            Spacer()
        }
        .padding(10)
        .background(Color.white.opacity(0.05))
        .cornerRadius(14)
    }

    private func trackRow(_ track: MusicDistributionTrack) -> some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: track.cover ?? "")) { img in
                img.resizable().scaledToFill()
            } placeholder: {
                ZStack {
                    RoundedRectangle(cornerRadius: 8).fill(Color.white.opacity(0.08))
                    Image(systemName: "music.note").foregroundColor(theme.textSecondary)
                }
            }
            .frame(width: 48, height: 48)
            .clipShape(RoundedRectangle(cornerRadius: 8))
            VStack(alignment: .leading, spacing: 2) {
                Text(track.title ?? "").font(.system(size: 15, weight: .medium)).foregroundColor(theme.textPrimary)
                Text("\(track.artist ?? "") · \(track.format?.uppercased() ?? "MP3")")
                    .font(.system(size: 12)).foregroundColor(theme.textSecondary)
            }
            Spacer()
        }
        .padding(10)
        .background(Color.white.opacity(0.06))
        .cornerRadius(14)
    }

    private func noArtistCard -> some View {
        VStack(spacing: 14) {
            Spacer()
            Image(systemName: "person.crop.circle.badge.plus")
                .font(.system(size: 52))
                .foregroundColor(theme.textSecondary.opacity(0.6))
            Text("У вас нет карточки артиста")
                .font(.system(size: 16, weight: .medium))
                .foregroundColor(theme.textSecondary)
            Button {
                showArtistModal = true
            } label: {
                Text("Создать")
                    .font(.system(size: 16, weight: .semibold))
                    .frame(width: 180)
                    .padding(.vertical, 14)
                    .background(Color(hex: "#6C63FF"))
                    .foregroundColor(.white)
                    .cornerRadius(14)
            }
            Spacer()
        }
    }

    private func artistProfile(_ artist: Artist) -> some View {
        ScrollView {
            VStack(spacing: 16) {
                hero(artist)
                modSection(artist)
                myTracksSection(artist)
            }
            .padding(.bottom, 24)
        }
    }

    private func hero(_ artist: Artist) -> some View {
        ZStack(alignment: .bottom) {
            if let banner = artist.banner, let url = URL(string: banner) {
                AsyncImage(url: url) { img in
                    img.resizable().scaledToFill().frame(height: 180).clipped()
                } placeholder: {
                    Color.white.opacity(0.05).frame(height: 180)
                }
                .frame(height: 180)
            } else {
                Color.white.opacity(0.05).frame(height: 160)
            }
            VStack(spacing: 8) {
                AsyncImage(url: URL(string: artist.photo ?? "")) { img in
                    img.resizable().scaledToFill()
                } placeholder: {
                    ZStack {
                        Circle().fill(Color(hex: "#6C63FF"))
                        Text(artist.name.prefix(1).uppercased()).font(.system(size: 28, weight: .bold)).foregroundColor(.white)
                    }
                }
                .frame(width: 84, height: 84)
                .clipShape(Circle())
                .overlay(Circle().strokeBorder(Color.white, lineWidth: 3))
                .offset(y: 42)

                Text(artist.name)
                    .font(.system(size: 20, weight: .bold))
                    .foregroundColor(theme.textPrimary)

                Button {
                    showUploadModal = true
                } label: {
                    HStack(spacing: 6) {
                        Image(systemName: "plus")
                        Text("Добавить трек")
                    }
                    .font(.system(size: 14, weight: .semibold))
                    .padding(.horizontal, 18)
                    .padding(.vertical, 10)
                    .background(Color.white.opacity(0.12))
                    .foregroundColor(theme.textPrimary)
                    .cornerRadius(20)
                }
                .padding(.top, 4)
            }
            .padding(.top, 30)
            .padding(.bottom, 16)
        }
        .background(Color.white.opacity(0.05))
    }

    private func modSection(_ artist: Artist) -> some View {
        let mod = (artist.tracks ?? []).filter { $0.status == "moderation" }
        return VStack(alignment: .leading, spacing: 8) {
            Text("Модерация")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(theme.textPrimary)
            if mod.isEmpty {
                Text("Нет треков на модерации")
                    .font(.system(size: 14))
                    .foregroundColor(theme.textSecondary)
                    .padding(.vertical, 12)
            } else {
                ForEach(mod) { track in trackStatusRow(track) }
            }
        }
        .padding(.horizontal, 16)
    }

    private func myTracksSection(_ artist: Artist) -> some View {
        let tracks = artist.tracks ?? []
        return VStack(alignment: .leading, spacing: 8) {
            Text("Мои треки")
                .font(.system(size: 16, weight: .semibold))
                .foregroundColor(theme.textPrimary)
            if tracks.isEmpty {
                Text("Пока нет треков")
                    .font(.system(size: 14))
                    .foregroundColor(theme.textSecondary)
                    .padding(.vertical, 12)
            } else {
                ForEach(tracks) { track in trackStatusRow(track) }
            }
        }
        .padding(.horizontal, 16)
    }

    private func trackStatusRow(_ track: MusicDistributionTrack) -> some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: track.cover ?? "")) { img in
                img.resizable().scaledToFill()
            } placeholder: {
                ZStack {
                    RoundedRectangle(cornerRadius: 8).fill(Color.white.opacity(0.08))
                    Image(systemName: "music.note").foregroundColor(theme.textSecondary)
                }
            }
            .frame(width: 48, height: 48)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            VStack(alignment: .leading, spacing: 3) {
                Text(track.title ?? "").font(.system(size: 15, weight: .medium)).foregroundColor(theme.textPrimary)
                Text("\(track.format?.uppercased() ?? "MP3") · \(track.isPublic == true ? "Публичный" : "Приватный")")
                    .font(.system(size: 12)).foregroundColor(theme.textSecondary)
            }
            Spacer()
            statusBadge(track.status ?? "moderation")
        }
        .padding(10)
        .background(Color.white.opacity(track.status == "rejected" ? 0.03 : 0.06))
        .cornerRadius(14)
    }

    private func statusBadge(_ status: String) -> some View {
        let (text, color) = statusBadgeContent(status)
        return Text(text)
            .font(.system(size: 11, weight: .semibold))
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(color.opacity(0.15))
            .foregroundColor(color)
            .cornerRadius(12)
    }

    private func statusBadgeContent(_ status: String) -> (String, Color) {
        switch status {
        case "published": return ("Опубликован", .green)
        case "rejected": return ("Отклонён", Color(hex: "#FF453A"))
        default: return ("На модерации", Color(hex: "#F0A500"))
        }
    }

    private func load() {
        loading = true
        Task {
            do {
                let resp = try await APIClient.shared.getArtistProfile()
                await MainActor.run { artist = resp.artist; loading = false; onLoaded?() }
            } catch {
                await MainActor.run { loading = false }
            }
        }
    }

    private func okSearch(_ q: String) {
        guard !q.isEmpty else { searchResults = nil; return }
        Task {
            do {
                let r = try await APIClient.shared.searchMusic(q)
                await MainActor.run { searchResults = r }
            } catch {}
        }
    }
}

struct CreateArtistCardSheet: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject private var theme = ThemeManager.shared
    @State private var name = ""
    @State private var photo: Data?
    @State private var banner: Data?
    @State private var photoItem: PhotosPickerItem?
    @State private var bannerItem: PhotosPickerItem?
    @State private var saving = false
    @State private var errorText: String?
    var onCompleted: (Artist) -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    artistPreview

                    inputField("Никнейм артиста", text: $name)

                    PhotosPicker(selection: $photoItem, matching: .images) {
                        fieldRow("Фото", "Выбрать файл")
                    }
                    PhotosPicker(selection: $bannerItem, matching: .images) {
                        fieldRow("Баннер", "Выбрать файл")
                    }

                    if let errorText {
                        Text(errorText).font(.system(size: 13)).foregroundColor(Color(hex: "#FF453A"))
                    }
                    Spacer(minLength: 24)
                }
                .padding(20)
            }
            .background(theme.bgColor.ignoresSafeArea())
            .navigationTitle("Карточка артиста")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        submit()
                    } label: {
                        if saving { ProgressView().tint(.white) }
                        else { Text("Готово").fontWeight(.semibold) }
                    }
                    .disabled(saving || name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }
                        .foregroundColor(Color(hex: "#6C63FF"))
                }
            }
            .onChange(of: photoItem) { item in
                Task { if let data = try? await item?.loadTransferable(type: Data.self) { photo = data } }
            }
            .onChange(of: bannerItem) { item in
                Task { if let data = try? await item?.loadTransferable(type: Data.self) { banner = data } }
            }
        }
        .tint(Color(hex: "#6C63FF"))
    }

    private var artistPreview: some View {
        ZStack(alignment: .bottom) {
            if let banner {
                Image(uiImage: banner.toUIImage())
                    .resizable().scaledToFill().frame(height: 160).clipped()
            } else {
                Color.white.opacity(0.06).frame(height: 160)
            }
            VStack(spacing: 6) {
                ZStack {
                    Circle().fill(Color(hex: "#6C63FF")).frame(width: 72, height: 72)
                    if let photo {
                        Image(uiImage: photo.toUIImage()).resizable().scaledToFill()
                    } else {
                        Text(name.isEmpty ? "?" : name.prefix(1).uppercased())
                            .font(.system(size: 28, weight: .bold)).foregroundColor(.white)
                    }
                }
                .clipShape(Circle())
                .overlay(Circle().strokeBorder(Color.white, lineWidth: 3))
                Text(name.isEmpty ? "Никнейм" : name)
                    .font(.system(size: 17, weight: .semibold))
                    .foregroundColor(.white)
            }
            .padding(.top, 40)
            .padding(.bottom, 14)
        }
        .background(Color.white.opacity(0.05))
        .cornerRadius(16)
        .frame(height: 170)
    }

    private func inputField(_ placeholder: String, value: Binding<String>) -> some View {
        TextField(placeholder, text: value)
            .font(.system(size: 15))
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(Color.white.opacity(0.08))
            .cornerRadius(12)
    }

    private func fieldRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(label).font(.system(size: 14, weight: .semibold)).foregroundColor(.white)
            Spacer()
            Text(value).font(.system(size: 13)).foregroundColor(.white.opacity(0.6))
        }
        .padding(.horizontal, 14)
        .padding(.vertical, 12)
        .background(Color.white.opacity(0.06))
        .cornerRadius(12)
    }

    private func submit() {
        let trimmed = name.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !trimmed.isEmpty else { errorText = "Введите никнейм"; return }
        saving = true
        Task {
            do {
                let resp = try await APIClient.shared.createArtistCard(name: trimmed, photo: photo, banner: banner)
                let artist = resp.artist ?? Artist(id: "", userId: "", name: trimmed, photo: nil, banner: nil, createdAt: nil, tracks: [])
                await MainActor.run { onCompleted(artist) }
            } catch {
                await MainActor.run { errorText = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription }
            }
            saving = false
        }
    }
}

struct UploadTrackModal: View {
    @Environment(\.dismiss) private var dismiss
    @State private var title = ""
    @State private var audio: AudioItem?
    @State private var cover: Data?
    @State private var audioItem: PhotosPickerItem?
    @State private var coverItem: PhotosPickerItem?
    @State private var isPublic = true
    @State private var releaseNow = true
    @State private var scheduledAt = Date()
    @State private var showFiles = false
    @State private var saving = false
    @State private var errorText: String?
    let artistName: String
    var onCompleted: () -> Void

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 16) {
                    inputField("Название трека", value: $title)

                    Button {
                        showFiles = true
                    } label: {
                        HStack {
                            VStack(alignment: .leading, spacing: 3) {
                                Text("Аудио (MP3/WAV)").font(.system(size: 14, weight: .semibold)).foregroundColor(.white)
                                Text(audio?.title ?? "Выбрать файл").font(.system(size: 12)).foregroundColor(.white.opacity(0.6))
                            }
                            Spacer()
                            Image(systemName: "music.note").foregroundColor(Color(hex: "#6C63FF"))
                        }
                        .padding(.horizontal, 14).padding(.vertical, 12)
                        .background(Color.white.opacity(0.06)).cornerRadius(12)
                    }

                    PhotosPicker(selection: $coverItem, matching: .images) {
                        HStack {
                            Text("Обложка").font(.system(size: 14, weight: .semibold)).foregroundColor(.white)
                            Spacer()
                            Text("Выбрать файл").font(.system(size: 12)).foregroundColor(.white.opacity(0.6))
                        }
                        .padding(.horizontal, 14).padding(.vertical, 12)
                        .background(Color.white.opacity(0.06)).cornerRadius(12)
                    }

                    toggleRow("Публичный трек", isOn: $isPublic)
                    toggleRow("Выложить сейчас", isOn: $releaseNow)
                    if !releaseNow {
                        DatePicker("Выложить", selection: $scheduledAt)
                            .datePickerStyle(.compact)
                            .foregroundColor(.white)
                    }

                    if let errorText {
                        Text(errorText).font(.system(size: 13)).foregroundColor(Color(hex: "#FF453A"))
                    }
                    Spacer(minLength: 24)
                }
                .padding(20)
            }
            .navigationTitle("Новый трек")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .confirmationAction) {
                    Button {
                        submit()
                    } label: {
                        if saving { ProgressView().tint(.white) }
                        else { Text("Готово").fontWeight(.semibold) }
                    }
                    .disabled(saving || title.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || audio == nil)
                }
                ToolbarItem(placement: .cancellationAction) {
                    Button("Отмена") { dismiss() }.foregroundColor(Color(hex: "#6C63FF"))
                }
            }
            .fileImporter(isPresented: $showFiles, allowedContentTypes: [.mp3, .wav, .audio]) { result in
                if case .success(let url) = result {
                    guard url.startAccessingSecurityScopedResource() else { return }
                    defer { url.stopAccessingSecurityScopedResource() }
                    audio = AudioItem(title: url.lastPathComponent, url: url)
                }
            }
            .onChange(of: coverItem) { item in
                Task { if let data = try? await item?.loadTransferable(type: Data.self) { cover = data } }
            }
        }
        .tint(Color(hex: "#6C63FF"))
    }

    private func inputField(_ placeholder: String, value: Binding<String>) -> some View {
        TextField(placeholder, text: value)
            .font(.system(size: 15))
            .padding(.horizontal, 14).padding(.vertical, 12)
            .background(Color.white.opacity(0.08)).cornerRadius(12)
    }

    private func toggleRow(_ label: String, isOn: Binding<Bool>) -> some View {
        Toggle(isOn: isOn) {
            Text(label).font(.system(size: 14, weight: .medium)).foregroundColor(.white)
        }
        .tint(Color(hex: "#6C63FF"))
    }

    private func submit() {
        guard let audio else { errorText = "Выберите MP3 или WAV"; return }
        saving = true
        Task {
            do {
                var form = MultiPartForm()
                let data = try Data(contentsOf: audio.url)
                let isWav = audio.title.lowercased().hasSuffix(".wav")
                form.addFile(name: "file", fileName: audio.title, data: data, contentType: isWav ? "audio/wav" : "audio/mpeg")
                if let cover { form.addFile(name: "cover", fileName: "cover.jpg", data: cover, contentType: "image/jpeg") }
                form.addField(name: "title", value: title.trimmingCharacters(in: .whitespacesAndNewlines))
                form.addField(name: "isPublic", value: isPublic ? "true" : "false")
                form.addField(name: "releaseNow", value: releaseNow ? "true" : "false")
                if !releaseNow {
                    form.addField(name: "scheduledAt", value: String(Int(scheduledAt.timeIntervalSince1970 * 1000)))
                }
                _ = try await APIClient.shared.uploadMusicTrack(form: form)
                await MainActor.run { onCompleted() }
            } catch {
                await MainActor.run { errorText = (error as? LocalizedError)?.errorDescription ?? error.localizedDescription }
            }
            saving = false
        }
    }
}

struct AudioItem {
    let title: String
    let url: URL
}

extension Data {
    func toUIImage() -> UIImage {
        UIImage(data: self) ?? UIImage()
    }
}