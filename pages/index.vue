<template>
  <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
    <!-- Navigation Header -->
    <nav class="sticky top-0 z-50 bg-white/80 backdrop-blur-lg border-b border-gray-200 shadow-sm">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Logo -->
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
              <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <span class="text-xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              StudentTracker
            </span>
          </div>

          <!-- Navigation Links -->
          <div class="hidden md:flex items-center gap-8">
            <a href="#features" class="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Funkce
            </a>
            <a href="#how-it-works" class="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Jak to funguje
            </a>
            <a href="#for-teachers" class="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Pro učitele
            </a>
            <a href="#for-students" class="text-gray-700 hover:text-blue-600 transition-colors font-medium">
              Pro studenty
            </a>
          </div>

          <!-- Login Button -->
          <button
            @click="showLoginModal = true"
            class="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-semibold"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
            </svg>
            Přihlásit se
          </button>
        </div>
      </div>
    </nav>

    <!-- Hero Section -->
    <section class="relative overflow-hidden py-20 px-4 sm:px-6 lg:px-8">
      <!-- Animated background -->
      <div class="absolute inset-0 overflow-hidden pointer-events-none">
        <div class="absolute -top-40 -right-40 w-80 h-80 bg-purple-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob"></div>
        <div class="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-300 rounded-full mix-blend-multiply filter blur-xl opacity-20 animate-blob animation-delay-2000"></div>
      </div>

      <div class="max-w-7xl mx-auto relative z-10">
        <div class="text-center space-y-8">
          <h1 class="text-5xl md:text-6xl lg:text-7xl font-extrabold text-gray-900 leading-tight">
            Sledování pokroku studentů
            <span class="block bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
              v reálném čase
            </span>
          </h1>
          <p class="text-xl md:text-2xl text-gray-600 max-w-3xl mx-auto">
            Inteligentní platforma s AI asistentem pro efektivní výuku a okamžitou zpětnou vazbu
          </p>
          <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
            <button
              @click="showLoginModal = true"
              class="px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-xl hover:shadow-2xl font-bold text-lg transform hover:scale-105"
            >
              Začít jako učitel
            </button>
            <NuxtLink
              to="/join"
              class="px-8 py-4 bg-white text-gray-900 rounded-2xl hover:bg-gray-50 transition-all shadow-xl hover:shadow-2xl font-bold text-lg border-2 border-gray-200 transform hover:scale-105"
            >
              Vstoupit do skupiny
            </NuxtLink>
          </div>
        </div>

        <!-- Hero Image/Illustration -->
        <div class="mt-16 relative">
          <div class="bg-white rounded-3xl shadow-2xl border border-gray-200 p-8 max-w-4xl mx-auto">
            <div class="aspect-video bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center">
              <svg class="w-32 h-32 text-blue-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Features Section -->
    <section id="features" class="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Klíčové funkce
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Vše, co potřebujete pro efektivní sledování a podporu studentů
          </p>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <!-- Feature 1 -->
          <div class="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
            <div class="w-14 h-14 bg-blue-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Realtime sledování</h3>
            <p class="text-gray-700">
              Okamžitý přehled o pokroku každého studenta díky WebSocket komunikaci. Vidíte vše, co se děje, právě teď.
            </p>
          </div>

          <!-- Feature 2 -->
          <div class="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
            <div class="w-14 h-14 bg-purple-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">AI asistent</h3>
            <p class="text-gray-700">
              Inteligentní chatbot využívající GPT-4 pomáhá studentům s úkoly a poskytuje okamžitou zpětnou vazbu.
            </p>
          </div>

          <!-- Feature 3 -->
          <div class="bg-gradient-to-br from-pink-50 to-pink-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
            <div class="w-14 h-14 bg-pink-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">QR kód vstup</h3>
            <p class="text-gray-700">
              Snadný vstup studentů do skupiny pomocí QR kódu. Žádné složité registrace ani hesla.
            </p>
          </div>

          <!-- Feature 4 -->
          <div class="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
            <div class="w-14 h-14 bg-green-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Sledování pokroku</h3>
            <p class="text-gray-700">
              Přehledné grafy a statistiky ukazující, jak každý student plní stanovené cíle a kde potřebuje pomoc.
            </p>
          </div>

          <!-- Feature 5 -->
          <div class="bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
            <div class="w-14 h-14 bg-yellow-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Notifikace</h3>
            <p class="text-gray-700">
              Okamžitá upozornění, když student potřebuje pomoc nebo dosáhne důležitého milníku.
            </p>
          </div>

          <!-- Feature 6 -->
          <div class="bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-2xl p-8 hover:shadow-xl transition-shadow">
            <div class="w-14 h-14 bg-indigo-600 rounded-xl flex items-center justify-center mb-6">
              <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"/>
              </svg>
            </div>
            <h3 class="text-2xl font-bold text-gray-900 mb-3">Flexibilní cíle</h3>
            <p class="text-gray-700">
              Nastavte si vlastní vzdělávací cíle a sledujte jejich plnění v reálném čase pro každého studenta.
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- How It Works -->
    <section id="how-it-works" class="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div class="max-w-7xl mx-auto">
        <div class="text-center mb-16">
          <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Jak to funguje
          </h2>
          <p class="text-xl text-gray-600 max-w-2xl mx-auto">
            Tři jednoduché kroky k efektivnímu sledování pokroku
          </p>
        </div>

        <div class="grid md:grid-cols-3 gap-8">
          <!-- Step 1 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-blue-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              1
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Vytvořte skupinu</h3>
            <p class="text-gray-600">
              Učitel vytvoří skupinu, nastaví cíle a dostane QR kód pro studenty
            </p>
          </div>

          <!-- Step 2 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-purple-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              2
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Studenti se připojí</h3>
            <p class="text-gray-600">
              Studenti naskenují QR kód a začnou pracovat s AI asistentem
            </p>
          </div>

          <!-- Step 3 -->
          <div class="text-center">
            <div class="w-16 h-16 bg-pink-600 text-white rounded-full flex items-center justify-center text-2xl font-bold mx-auto mb-6">
              3
            </div>
            <h3 class="text-xl font-bold text-gray-900 mb-3">Sledujte v reálném čase</h3>
            <p class="text-gray-600">
              Učitel vidí pokrok všech studentů a může okamžitě reagovat
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- For Teachers Section -->
    <section id="for-teachers" class="py-20 px-4 sm:px-6 lg:px-8 bg-white">
      <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div>
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Pro učitele
            </h2>
            <p class="text-xl text-gray-600 mb-8">
              Získejte kompletní přehled o pokroku každého studenta a věnujte čas těm, kteří to nejvíce potřebují.
            </p>
            <ul class="space-y-4">
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700"><strong>Dashboard v reálném čase</strong> - Vidíte pokrok všech studentů najednou</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700"><strong>Automatická analýza</strong> - AI vyhodnocuje relevanci příspěvků studentů</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700"><strong>Notifikace o pomoci</strong> - Okamžitě víte, kdo potřebuje vaši podporu</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700"><strong>Historie konverzací</strong> - Přístup ke všem zpráv��m studentů s AI</span>
              </li>
            </ul>
            <button
              @click="showLoginModal = true"
              class="mt-8 px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-2xl hover:from-blue-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg"
            >
              Začít zdarma
            </button>
          </div>
          <div class="bg-gradient-to-br from-blue-100 to-purple-100 rounded-3xl p-8 aspect-square flex items-center justify-center">
            <svg class="w-64 h-64 text-blue-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 10V7m0 10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2"/>
            </svg>
          </div>
        </div>
      </div>
    </section>

    <!-- For Students Section -->
    <section id="for-students" class="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-br from-gray-50 to-white">
      <div class="max-w-7xl mx-auto">
        <div class="grid lg:grid-cols-2 gap-12 items-center">
          <div class="order-2 lg:order-1 bg-gradient-to-br from-purple-100 to-pink-100 rounded-3xl p-8 aspect-square flex items-center justify-center">
            <svg class="w-64 h-64 text-purple-600 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>
            </svg>
          </div>
          <div class="order-1 lg:order-2">
            <h2 class="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Pro studenty
            </h2>
            <p class="text-xl text-gray-600 mb-8">
              Pracujte ve svém tempu s inteligentním asistentem, který vám vždy pomůže a povzbudí.
            </p>
            <ul class="space-y-4">
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700"><strong>AI asistent 24/7</strong> - Okamžitá pomoc s úkoly kdykoliv potřebujete</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700"><strong>Vizualizace pokroku</strong> - Vidíte, jak se vám daří v reálném čase</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700"><strong>Jednoduchý vstup</strong> - Jen naskenujte QR kód a můžete začít</span>
              </li>
              <li class="flex items-start gap-3">
                <svg class="w-6 h-6 text-green-600 flex-shrink-0 mt-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                <span class="text-gray-700"><strong>Podpora hlasem</strong> - Můžete diktovat své odpovědi místo psaní</span>
              </li>
            </ul>
            <NuxtLink
              to="/join"
              class="mt-8 inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-2xl hover:from-purple-700 hover:to-pink-700 transition-all shadow-lg hover:shadow-xl font-bold text-lg"
            >
              Vstoupit do skupiny
            </NuxtLink>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA Section -->
    <section class="py-20 px-4 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600">
      <div class="max-w-4xl mx-auto text-center text-white">
        <h2 class="text-4xl md:text-5xl font-bold mb-6">
          Připraveni začít?
        </h2>
        <p class="text-xl mb-8 opacity-90">
          Připojte se k modernímu způsobu výuky a sledování pokroku studentů
        </p>
        <div class="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button
            @click="showLoginModal = true"
            class="px-8 py-4 bg-white text-gray-900 rounded-2xl hover:bg-gray-100 transition-all shadow-xl hover:shadow-2xl font-bold text-lg"
          >
            Přihlásit se jako učitel
          </button>
          <NuxtLink
            to="/join"
            class="px-8 py-4 bg-transparent border-2 border-white text-white rounded-2xl hover:bg-white hover:text-gray-900 transition-all shadow-xl font-bold text-lg"
          >
            Vstoupit do skupiny
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- Footer -->
    <footer class="bg-gray-900 text-white py-12 px-4 sm:px-6 lg:px-8">
      <div class="max-w-7xl mx-auto">
        <div class="grid md:grid-cols-3 gap-8">
          <div>
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span class="text-xl font-bold">StudentTracker</span>
            </div>
            <p class="text-gray-400">
              Moderní platforma pro sledování pokroku studentů s AI asistentem
            </p>
          </div>
          <div>
            <h3 class="font-bold mb-4">Odkazy</h3>
            <ul class="space-y-2 text-gray-400">
              <li><a href="#features" class="hover:text-white transition-colors">Funkce</a></li>
              <li><a href="#how-it-works" class="hover:text-white transition-colors">Jak to funguje</a></li>
              <li><a href="#for-teachers" class="hover:text-white transition-colors">Pro učitele</a></li>
              <li><a href="#for-students" class="hover:text-white transition-colors">Pro studenty</a></li>
            </ul>
          </div>
          <div>
            <h3 class="font-bold mb-4">Kontakt</h3>
            <ul class="space-y-2 text-gray-400">
              <li>Email: info@studenttracker.cz</li>
              <li>Tel: +420 123 456 789</li>
            </ul>
          </div>
        </div>
        <div class="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
          <p>&copy; 2025 StudentTracker. Všechna práva vyhrazena.</p>
        </div>
      </div>
    </footer>

    <!-- Login Modal -->
    <Teleport to="body">
      <Transition name="fade">
        <div
          v-if="showLoginModal"
          class="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          @click.self="showLoginModal = false"
        >
          <div class="bg-white rounded-3xl shadow-2xl max-w-md w-full p-8 relative">
            <button
              @click="showLoginModal = false"
              class="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
            >
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>

            <div class="text-center mb-6">
              <h3 class="text-2xl font-bold text-gray-900 mb-2">Přihlášení učitele</h3>
              <p class="text-gray-600">Přihlaste se pomocí Google účtu</p>
            </div>

            <button
              @click="handleGoogleSignIn"
              :disabled="isLoading"
              class="w-full flex items-center justify-center gap-4 px-6 py-4 bg-white border-2 border-gray-200 rounded-2xl hover:border-blue-400 hover:bg-blue-50 transition-all shadow-lg disabled:opacity-50"
            >
              <svg v-if="!isLoading" class="w-7 h-7" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              <div v-else class="loading-spinner w-7 h-7"></div>
              <span class="text-lg font-semibold text-gray-700">
                {{ isLoading ? 'Přihlašování...' : 'Pokračovat s Google' }}
              </span>
            </button>

            <div v-if="error" class="mt-4 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800">
              {{ error }}
            </div>
          </div>
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
definePageMeta({
  layout: false
})

const supabase = useSupabaseClient()
const router = useRouter()
const showLoginModal = ref(false)
const isLoading = ref(false)
const error = ref('')

// Zkontrolovat session při načtení stránky
onMounted(async () => {
  try {
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Uživatel je přihlášen, přesměrovat na dashboard
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      const role = userData?.role || 'teacher'
      await router.push(role === 'teacher' ? '/teacher/dashboard' : '/student/groups')
    }
  } catch (error) {
    console.error('Error checking session:', error)
  }
})

const handleGoogleSignIn = async () => {
  error.value = ''
  isLoading.value = true
  
  try {
    // Zkontrolovat, zda už není uživatel přihlášen
    const { data: { session } } = await supabase.auth.getSession()
    
    if (session?.user) {
      // Uživatel je přihlášen, přesměrovat na dashboard
      isLoading.value = false
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', session.user.id)
        .single()
      
      const role = userData?.role || 'teacher'
      await navigateTo(role === 'teacher' ? '/teacher/dashboard' : '/student/groups')
      return
    }
    
    // Přihlášení přes Google (bez prompt: 'consent' pro automatické přihlášení)
    const { error: signInError } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          // Odstraněno prompt: 'consent' - umožní automatické přihlášení pokud už je uživatel přihlášen v Google
        }
      }
    })
    
    if (signInError) throw signInError
  } catch (e: any) {
    console.error('Sign-in error:', e)
    error.value = e.message || 'Nepodařilo se přihlásit'
    isLoading.value = false
  }
}
</script>

<style scoped>
@keyframes blob {
  0%, 100% {
    transform: translate(0, 0) scale(1);
  }
  33% {
    transform: translate(30px, -50px) scale(1.1);
  }
  66% {
    transform: translate(-20px, 20px) scale(0.9);
  }
}

.animate-blob {
  animation: blob 7s infinite;
}

.animation-delay-2000 {
  animation-delay: 2s;
}

.loading-spinner {
  display: inline-block;
  border: 3px solid rgba(59, 130, 246, 0.2);
  border-top-color: #3b82f6;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* Smooth scroll */
html {
  scroll-behavior: smooth;
}
</style>

Toto je kompletní úvodní stránka s:
- **Přihlášením vpravo nahoře** - pouze pro učitele
- **Informacemi o aplikaci** - funkce, jak to funguje, pro koho je to
- **QR kód je skrytý** - zobrazuje se až v učitelském dashboardu
- **CTA tlačítka** pro vstup do skupiny i přihlášení
- **Responzivní design** - funguje na všech zařízeních
- **Moderní UI** - s animacemi a gradientem
