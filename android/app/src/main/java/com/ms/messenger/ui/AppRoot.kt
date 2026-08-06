package com.ms.messenger.ui

import androidx.compose.animation.Crossfade
import androidx.compose.animation.core.tween
import androidx.compose.animation.fadeIn
import androidx.compose.animation.fadeOut
import androidx.compose.animation.slideInHorizontally
import androidx.compose.animation.slideOutHorizontally
import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.compose.rememberNavController
import com.ms.messenger.data.PrefsHolder
import com.ms.messenger.ui.auth.LoginScreen
import com.ms.messenger.ui.auth.RegisterScreen
import com.ms.messenger.ui.chats.ChatDetailScreen
import com.ms.messenger.ui.main.MainTabsScreen
import com.ms.messenger.ui.onboarding.WelcomeScreen

object Routes {
    const val WELCOME = "welcome"
    const val LOGIN = "login"
    const val REGISTER = "register"
    const val MAIN = "main"
    const val CHAT = "chat/{chatId}"
    fun chat(chatId: String) = "chat/$chatId"
}

private val slideIn = slideInHorizontally(tween(300)) { it }
private val slideOut = slideOutHorizontally(tween(300)) { it }
private val slideInPop = slideInHorizontally(tween(300)) { -it / 3 }
private val slideOutPop = slideOutHorizontally(tween(300)) { -it / 3 }

@Composable
fun AppRoot(
    sessionValid: Boolean,
    onSessionChanged: (Boolean) -> Unit,
) {
    Crossfade(targetState = sessionValid) { loggedIn ->
        val navController = rememberNavController()
        if (loggedIn) {
            NavHost(navController = navController, startDestination = Routes.MAIN) {
                composable(
                    Routes.MAIN,
                    enterTransition = { fadeIn(tween(400)) },
                    exitTransition = { fadeOut(tween(200)) },
                    popEnterTransition = { fadeIn(tween(300)) },
                    popExitTransition = { fadeOut(tween(200)) }
                ) {
                    MainTabsScreen(
                        onOpenChat = { chatId ->
                            navController.navigate(Routes.chat(chatId))
                        },
                        onLogout = {
                            PrefsHolder.session.logout()
                            onSessionChanged(false)
                        }
                    )
                }
                composable(
                    Routes.CHAT,
                    enterTransition = { slideIn + fadeIn(tween(300)) },
                    exitTransition = { slideOut + fadeOut(tween(200)) },
                    popEnterTransition = { slideInPop + fadeIn(tween(300)) },
                    popExitTransition = { slideOutPop + fadeOut(tween(200)) }
                ) { backStackEntry ->
                    val chatId = backStackEntry.arguments?.getString("chatId") ?: ""
                    ChatDetailScreen(
                        chatId = chatId,
                        onBack = { navController.popBackStack() }
                    )
                }
            }
        } else {
            AuthNavHost(navController, onSessionChanged)
        }
    }
}

@Composable
fun AuthNavHost(navController: NavHostController, onSessionChanged: (Boolean) -> Unit) {
    NavHost(
        navController = navController,
        startDestination = Routes.WELCOME,
        enterTransition = { slideInHorizontally(tween(350)) { it } + fadeIn(tween(250)) },
        exitTransition = { slideOutHorizontally(tween(350)) { -it / 4 } + fadeOut(tween(200)) },
        popEnterTransition = { slideInHorizontally(tween(350)) { -it / 4 } + fadeIn(tween(250)) },
        popExitTransition = { slideOutHorizontally(tween(350)) { it } + fadeOut(tween(200)) }
    ) {
        composable(Routes.WELCOME) {
            WelcomeScreen(
                onLogin = { navController.navigate(Routes.LOGIN) },
                onRegister = { navController.navigate(Routes.REGISTER) }
            )
        }
        composable(Routes.LOGIN) {
            LoginScreen(
                onBack = { navController.popBackStack() },
                onLoggedIn = { onSessionChanged(true) }
            )
        }
        composable(Routes.REGISTER) {
            RegisterScreen(
                onBack = { navController.popBackStack() },
                onLoggedIn = { onSessionChanged(true) }
            )
        }
    }
}